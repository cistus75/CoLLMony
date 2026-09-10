import { RESOURCE_CONFIG, SIMULATION_CONFIG } from '../config/simulation.js'
import { blockedCells, createMovePath, keyOf, nearestWorkPosition, workPositions } from './spatial.js'

export { createWorld } from './worldFactory.js'
export { createMovePath, distance, footprintCells, workPositions } from './spatial.js'

function addEvent(world, type, message) {
  world.log.push({ id: `${world.tick}-${world.nextEventId}`, tick: world.tick, type, message })
  world.nextEventId += 1
  world.log = world.log.slice(-SIMULATION_CONFIG.maxLogEntries)
}

function currentFrontier(world) {
  return world.buildings.filter((building) => building.status === 'REVEALED' || building.status === 'UNDER_CONSTRUCTION')
}

function hasInputs(storage, inputs) {
  return Object.entries(inputs).every(([resource, amount]) => storage[resource] >= amount)
}

function moveToward(world, agent, target) {
  const path = createMovePath(agent.position, target, blockedCells(world))
  agent.movePath = path
  if (!path.length) {
    agent.action = { type: 'WAIT', detail: '이동 경로를 찾는 중' }
    return
  }
  agent.position = { ...path.at(-1) }
  agent.stats.moves += path.length
  agent.action = { type: 'MOVE', detail: `${path.length}칸 이동` }
}

function startGather(agent, node) {
  const duration = RESOURCE_CONFIG[node.resource].kind === 'mineral' ? 4 : 2
  agent.gather = { resource: node.resource, remaining: duration }
  agent.action = { type: 'GATHER', detail: `${RESOURCE_CONFIG[node.resource].label} 채집 준비` }
}

function continueGather(world, agent) {
  agent.gather.remaining -= 1
  agent.action = { type: 'GATHER', detail: `${RESOURCE_CONFIG[agent.gather.resource].label} 채집 중 · ${agent.gather.remaining}틱` }
  if (agent.gather.remaining > 0) return
  const resource = agent.gather.resource
  agent.cargo = { type: resource, amount: agent.cargo.amount + 1 }
  agent.gather = null
  agent.stats.gathered += 1
  agent.action = { type: 'GATHER', detail: `${RESOURCE_CONFIG[resource].label} 1개 채집 완료` }
  addEvent(world, 'GATHER', `Agent ${agent.name}가 ${RESOURCE_CONFIG[resource].label} 1개를 채집했습니다.`)
}

function deliver(world, agent) {
  if (!agent.pendingDelivery) {
    agent.pendingDelivery = true
    agent.action = { type: 'DELIVER', detail: '창고 인계를 기다리는 중' }
    return
  }
  const { type, amount } = agent.cargo
  world.storage[type] += amount
  agent.cargo = { type: null, amount: 0 }
  agent.pendingDelivery = false
  agent.stats.delivered += amount
  agent.action = { type: 'DELIVER', detail: `${RESOURCE_CONFIG[type].label} ${amount}개 전달 완료` }
  addEvent(world, 'DELIVER', `Agent ${agent.name}가 ${RESOURCE_CONFIG[type].label} ${amount}개를 Camp에 전달했습니다.`)
}

function chooseResource(world, agent, frontier) {
  if (world.storage.Food < SIMULATION_CONFIG.survivalThreshold) return 'Food'
  if (world.storage.Water < SIMULATION_CONFIG.survivalThreshold) return 'Water'
  const needs = frontier.flatMap((building) => Object.entries(building.inputs))
    .filter(([resource, amount]) => world.storage[resource] < amount)
    .map(([resource]) => resource)
  if (needs.length) return needs[(agent.id - 1) % needs.length]
  return agent.id % 2 ? 'Wood' : 'Stone'
}

function revealNextTier(world) {
  const incomplete = world.buildings.some((building) => building.status === 'REVEALED' || building.status === 'UNDER_CONSTRUCTION')
  if (incomplete) return
  const nextTier = Math.min(...world.buildings.filter((building) => building.status === 'LOCKED').map((building) => building.tier))
  if (!Number.isFinite(nextTier)) {
    world.status = 'COMPLETE'
    addEvent(world, 'COMPLETE', '모든 기술 건물이 완성되었습니다.')
    return
  }
  world.buildings.filter((building) => building.tier === nextTier).forEach((building) => { building.status = 'REVEALED' })
  addEvent(world, 'TECH', `Tier ${nextTier} 기술이 공개되었습니다.`)
}

function updateUpkeep(world) {
  if (world.tick % SIMULATION_CONFIG.ticksPerDay !== 0) return
  world.agents.forEach((agent) => {
    for (const resource of ['Food', 'Water']) {
      const field = resource.toLowerCase()
      if (world.storage[resource] > 0) {
        world.storage[resource] -= 1
        agent.needs[field] = Math.min(0, agent.needs[field] + 1)
      } else {
        agent.needs[field] -= 1
      }
    }
  })
  addEvent(world, 'UPKEEP', '일일 식량과 물 유지비가 정산되었습니다.')
}

export function stepWorld(currentWorld) {
  if (currentWorld.status !== 'RUNNING') return currentWorld
  const world = structuredClone(currentWorld)
  world.tick += 1
  world.agents.forEach((agent) => { agent.movePath = [] })
  const frontier = currentFrontier(world)
  const buildable = frontier.find((building) => building.status === 'UNDER_CONSTRUCTION' || hasInputs(world.storage, building.inputs))
  const crew = []

  for (const agent of world.agents) {
    if (agent.gather) {
      continueGather(world, agent)
      continue
    }
    if (agent.cargo.amount > 0) {
      if (agent.cargo.amount < SIMULATION_CONFIG.cargoBatchSize) {
        const node = world.nodes.find((item) => item.resource === agent.cargo.type)
        const target = nearestWorkPosition(agent, node)
        if (keyOf(agent.position) === keyOf(target)) startGather(agent, node)
        else moveToward(world, agent, target)
        continue
      }
      const target = nearestWorkPosition(agent, world.camp)
      if (keyOf(agent.position) === keyOf(target)) deliver(world, agent)
      else {
        agent.pendingDelivery = false
        moveToward(world, agent, target)
      }
      continue
    }
    if (buildable) {
      const positions = workPositions(buildable)
      const target = positions[(agent.id - 1) % positions.length]
      if (keyOf(agent.position) === keyOf(target)) {
        if (buildable.status === 'REVEALED') {
          Object.entries(buildable.inputs).forEach(([resource, amount]) => { world.storage[resource] -= amount })
          buildable.status = 'UNDER_CONSTRUCTION'
          addEvent(world, 'BUILD', `${buildable.name} 건설이 시작되었습니다.`)
        }
        agent.action = { type: 'BUILD', detail: `${buildable.name} 건설 중` }
        crew.push(agent)
      } else {
        moveToward(world, agent, target)
      }
      continue
    }
    const resource = chooseResource(world, agent, frontier)
    const node = world.nodes.find((item) => item.resource === resource)
    const target = nearestWorkPosition(agent, node)
    if (keyOf(agent.position) === keyOf(target)) startGather(agent, node)
    else moveToward(world, agent, target)
  }

  if (buildable?.status === 'UNDER_CONSTRUCTION' && crew.length) {
    buildable.workRemaining = Math.max(0, buildable.workRemaining - crew.length)
    if (buildable.workRemaining === 0) {
      buildable.status = 'COMPLETE'
      crew.forEach((agent) => { agent.stats.built += 1 })
      addEvent(world, 'BUILD', `${buildable.name} 건설이 완료되었습니다.`)
      revealNextTier(world)
    }
  }

  updateUpkeep(world)
  if (world.tick >= SIMULATION_CONFIG.maxTicks && world.status === 'RUNNING') {
    world.status = 'TIME_LIMIT'
    addEvent(world, 'TIME_LIMIT', 'Episode가 최대 틱에 도달했습니다.')
  }
  return world
}

export function getFrontier(world) {
  return currentFrontier(world)
}
