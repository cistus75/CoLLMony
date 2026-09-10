import { ACTION_CONFIG, LAUNCH_CONFIG, RESOURCE_CONFIG, SIMULATION_CONFIG, UPKEEP_CONFIG } from '../config/simulation.js'
import { selectDefaultActions } from './defaultPolicy.js'
import { blockedCells, createMovePath, distance, keyOf, nearestWorkPosition, workPositions } from './spatial.js'

export { createWorld } from './worldFactory.js'
export { createAgentObservation, createObservations } from './observation.js'
export { createMovePath, distance, footprintCells, workPositions } from './spatial.js'

function addEvent(world, type, message) {
  world.log.push({ id: `${world.tick}-${world.nextEventId}`, tick: world.tick, type, message })
  world.nextEventId += 1
  world.log = world.log.slice(-SIMULATION_CONFIG.maxLogEntries)
}

function currentFrontier(world) {
  return world.buildings.filter((building) => building.status === 'REVEALED' || building.status === 'UNDER_CONSTRUCTION')
}

function storageById(world, storageId) {
  return world.storages.find((storage) => storage.id === storageId)
}

function nearestStorage(world, entity) {
  return world.storages.toSorted((a, b) => distance(a.position, entity.position) - distance(b.position, entity.position) || a.id.localeCompare(b.id))[0]
}

function hasInputs(storage, inputs) {
  return Object.entries(inputs).every(([resource, amount]) => storage.resources[resource] >= amount)
}

function moveToward(world, agent, target) {
  if (!target) {
    agent.action = { type: 'WAIT', detail: '작업 가능한 인접 셀이 없음' }
    return
  }
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

function startGather(agent, node, storageId) {
  agent.gather = { resource: node.resource, storageId, remaining: RESOURCE_CONFIG[node.resource].gatherDuration }
  agent.action = { type: 'GATHER', detail: `${RESOURCE_CONFIG[node.resource].label} 채집 준비` }
}

function continueGather(world, agent) {
  agent.gather.remaining -= 1
  agent.action = { type: 'GATHER', detail: `${RESOURCE_CONFIG[agent.gather.resource].label} 채집 중 · ${agent.gather.remaining}틱` }
  if (agent.gather.remaining > 0) return
  const { resource, storageId } = agent.gather
  agent.cargo = { type: resource, amount: agent.cargo.amount + 1, storageId }
  agent.gather = null
  agent.stats.gathered += 1
  agent.action = { type: 'GATHER', detail: `${RESOURCE_CONFIG[resource].label} 1개 채집 완료` }
  addEvent(world, 'GATHER', `Agent ${agent.name}가 ${RESOURCE_CONFIG[resource].label} 1개를 채집했습니다.`)
}

function deliver(world, agent, storage) {
  if (!agent.pendingDelivery) {
    agent.pendingDelivery = true
    agent.action = { type: 'DELIVER', detail: `${storage.name} 인계를 기다리는 중` }
    return
  }
  const { type, amount } = agent.cargo
  storage.resources[type] += amount
  agent.cargo = { type: null, amount: 0, storageId: null }
  agent.pendingDelivery = false
  agent.stats.delivered += amount
  agent.action = { type: 'DELIVER', detail: `${RESOURCE_CONFIG[type].label} ${amount}개 전달 완료` }
  addEvent(world, 'DELIVER', `Agent ${agent.name}가 ${RESOURCE_CONFIG[type].label} ${amount}개를 ${storage.name}에 전달했습니다.`)
}

function startProcess(world, agent, recipe, storage) {
  Object.entries(recipe.inputs).forEach(([resource, amount]) => { storage.resources[resource] -= amount })
  agent.process = { recipeId: recipe.id, storageId: storage.id, remaining: ACTION_CONFIG.PROCESS, output: structuredClone(recipe.output) }
  agent.action = { type: 'PROCESS', detail: `${recipe.name} 준비` }
}

function continueProcess(world, agent) {
  agent.process.remaining -= 1
  const recipe = world.recipes.find((item) => item.id === agent.process.recipeId)
  agent.action = { type: 'PROCESS', detail: `${recipe.name} 중 · ${agent.process.remaining}틱` }
  if (agent.process.remaining > 0) return
  const storage = storageById(world, agent.process.storageId)
  const { resource, amount } = agent.process.output
  storage.resources[resource] += amount
  agent.process = null
  agent.action = { type: 'PROCESS', detail: `${RESOURCE_CONFIG[resource].label} ${amount}개 생산 완료` }
  addEvent(world, 'PROCESS', `Agent ${agent.name}가 ${RESOURCE_CONFIG[resource].label} ${amount}개를 ${storage.name}에 생산했습니다.`)
}

function addBuildingStorage(world, building) {
  if (!building.storage || storageById(world, building.id)) return
  world.storages.push({
    id: building.id,
    name: building.name,
    position: structuredClone(building.position),
    size: structuredClone(building.size),
    resources: Object.fromEntries(Object.keys(RESOURCE_CONFIG).map((resource) => [resource, 0])),
  })
  addEvent(world, 'STORAGE', `${building.name}가 독립 저장소로 가동되었습니다.`)
}

function revealNextTier(world) {
  if (currentFrontier(world).length) return
  const nextTier = Math.min(...world.buildings.filter((building) => building.status === 'LOCKED').map((building) => building.tier))
  if (!Number.isFinite(nextTier)) {
    const launchpad = world.buildings.find((building) => building.id === LAUNCH_CONFIG.buildingId)
    world.launch = { status: 'READY', actorId: null, storageId: launchpad.storageId, remaining: 0 }
    addEvent(world, 'LAUNCH', '발사대와 로켓이 완성되었습니다. 로켓 연료 적재를 시작합니다.')
    return
  }
  world.buildings.filter((building) => building.tier === nextTier).forEach((building) => {
    building.status = 'REVEALED'
    building.storageId = nearestStorage(world, building).id
  })
  addEvent(world, 'TECH', `Tier ${nextTier} 기술이 공개되었습니다.`)
}

function startLaunch(world, agent, building, storage) {
  const { resource, amount } = LAUNCH_CONFIG.fuel
  storage.resources[resource] -= amount
  world.launch = { status: 'IN_PROGRESS', actorId: agent.id, storageId: storage.id, remaining: ACTION_CONFIG.LAUNCH }
  agent.action = { type: 'LAUNCH', detail: `${building.name} 발사 절차 진행 중` }
  addEvent(world, 'LAUNCH', `Agent ${agent.name}가 로켓 발사 절차를 시작했습니다.`)
}

function continueLaunch(world) {
  if (world.launch.status !== 'IN_PROGRESS') return false
  world.launch.remaining -= 1
  const actor = world.agents.find((agent) => agent.id === world.launch.actorId)
  actor.action = { type: 'LAUNCH', detail: `로켓 발사까지 ${world.launch.remaining}틱` }
  world.agents.filter((agent) => agent.id !== actor.id).forEach((agent) => {
    agent.action = { type: 'WAIT', detail: '발사 절차를 지켜보는 중' }
  })
  if (world.launch.remaining > 0) return true
  world.launch.status = 'COMPLETE'
  world.status = 'SUCCESS'
  actor.action = { type: 'LAUNCH', detail: '로켓 발사 성공' }
  addEvent(world, 'LAUNCH', '로켓이 성공적으로 발사되었습니다. Episode가 완료되었습니다.')
  return true
}

function updateUpkeep(world) {
  if (world.tick % UPKEEP_CONFIG.interval !== 0) return
  world.agents.forEach((agent) => {
    for (const [resource, amount] of Object.entries(UPKEEP_CONFIG.perAgent)) {
      const field = resource.toLowerCase()
      const storage = world.storages.find((candidate) => candidate.resources[resource] >= amount)
      if (storage) {
        storage.resources[resource] -= amount
        agent.needs[field] = Math.min(0, agent.needs[field] + 1)
      } else {
        agent.needs[field] -= 1
      }
    }
  })
  addEvent(world, 'UPKEEP', '일일 식량과 물 유지비가 정산되었습니다.')
}

function finishTick(world) {
  updateUpkeep(world)
  if (world.tick >= SIMULATION_CONFIG.maxTicks && world.status === 'RUNNING') {
    world.status = 'TIME_LIMIT'
    addEvent(world, 'TIME_LIMIT', 'Episode가 최대 틱에 도달했습니다.')
  }
  return world
}

function rejectAction(world, agent, detail) {
  agent.action = { type: 'WAIT', detail }
  addEvent(world, 'INVALID', `Agent ${agent.name}: ${detail}`)
}

function abandonCommitment(agent) {
  agent.gather = null
  agent.process = null
  agent.pendingDelivery = false
  agent.action = { type: 'WAIT', detail: '진행 중인 작업을 중단함' }
}

export function resolveTick(currentWorld, actions = []) {
  if (currentWorld.status !== 'RUNNING') return currentWorld
  const world = structuredClone(currentWorld)
  world.tick += 1
  world.agents.forEach((agent) => { agent.movePath = [] })

  if (continueLaunch(world)) return finishTick(world)

  const validActions = Array.isArray(actions) ? actions.filter((action) => action && Number.isInteger(action.agentId)) : []
  const actionByAgent = new Map(validActions.map((action) => [action.agentId, action]))
  const crews = new Map()
  const claimedWorkPositions = new Map()

  for (const agent of world.agents) {
    const intent = actionByAgent.get(agent.id) ?? { type: 'WAIT' }
    if (agent.process) {
      if (intent.type === 'CONTINUE') continueProcess(world, agent)
      else if (intent.type === 'ABANDON') abandonCommitment(agent)
      else rejectAction(world, agent, '생산 작업에는 CONTINUE 또는 ABANDON이 필요합니다.')
      continue
    }
    if (agent.gather) {
      if (intent.type === 'CONTINUE') continueGather(world, agent)
      else if (intent.type === 'ABANDON') abandonCommitment(agent)
      else rejectAction(world, agent, '채집 작업에는 CONTINUE 또는 ABANDON이 필요합니다.')
      continue
    }
    if (agent.cargo.amount > 0) {
      if (intent.type === 'GATHER' && agent.cargo.amount < SIMULATION_CONFIG.cargoBatchSize) {
        const node = world.nodes.find((item) => item.id === intent.nodeId)
        const storage = storageById(world, intent.storageId ?? agent.cargo.storageId)
        if (!node || node.resource !== agent.cargo.type || !storage) {
          rejectAction(world, agent, '현재 화물과 다른 자원을 채집할 수 없습니다.')
          continue
        }
        agent.cargo.storageId = storage.id
        agent.pendingDelivery = false
        const target = nearestWorkPosition(agent, node, blockedCells(world))
        if (keyOf(agent.position) === keyOf(target)) startGather(agent, node, storage.id)
        else moveToward(world, agent, target)
        continue
      }
      if (intent.type === 'DELIVER') {
        const storage = storageById(world, intent.storageId ?? agent.cargo.storageId)
        if (!storage) {
          rejectAction(world, agent, '존재하지 않는 저장소입니다.')
          continue
        }
        agent.cargo.storageId = storage.id
        const target = nearestWorkPosition(agent, storage, blockedCells(world))
        if (keyOf(agent.position) === keyOf(target)) deliver(world, agent, storage)
        else {
          agent.pendingDelivery = false
          moveToward(world, agent, target)
        }
        continue
      }
      rejectAction(world, agent, '화물을 먼저 채집하거나 저장소에 전달해야 합니다.')
      continue
    }

    if (intent.type === 'BUILD') {
      const building = world.buildings.find((item) => item.id === intent.buildingId)
      if (!building || (building.status !== 'REVEALED' && building.status !== 'UNDER_CONSTRUCTION')) {
        rejectAction(world, agent, '건설할 수 없는 건물입니다.')
        continue
      }
      const storage = storageById(world, building.storageId)
      if (building.status === 'REVEALED' && !hasInputs(storage, building.inputs)) {
        rejectAction(world, agent, `${building.name} 건설 자원이 부족합니다.`)
        continue
      }
      const claimed = claimedWorkPositions.get(building.id) ?? new Set()
      const target = workPositions(building, blockedCells(world))
        .filter((position) => !claimed.has(keyOf(position)))
        .toSorted((a, b) => distance(agent.position, a) - distance(agent.position, b) || keyOf(a).localeCompare(keyOf(b)))[0]
      if (!target) {
        agent.action = { type: 'WAIT', detail: `${building.name} 작업 위치를 기다리는 중` }
        continue
      }
      claimed.add(keyOf(target))
      claimedWorkPositions.set(building.id, claimed)
      if (keyOf(agent.position) === keyOf(target)) {
        if (building.status === 'REVEALED') {
          Object.entries(building.inputs).forEach(([resource, amount]) => { storage.resources[resource] -= amount })
          building.status = 'UNDER_CONSTRUCTION'
          addEvent(world, 'BUILD', `${building.name} 건설이 시작되었습니다.`)
        }
        agent.action = { type: 'BUILD', detail: `${building.name} 건설 중` }
        const crew = crews.get(building.id) ?? []
        crew.push(agent)
        crews.set(building.id, crew)
      } else {
        moveToward(world, agent, target)
      }
      continue
    }

    if (intent.type === 'PROCESS') {
      const recipe = world.recipes.find((item) => item.id === intent.recipeId)
      const storage = storageById(world, intent.storageId)
      const productionBuilding = recipe && world.buildings.find((building) => building.id === recipe.requires)
      if (!recipe || !storage || productionBuilding?.status !== 'COMPLETE' || !hasInputs(storage, recipe.inputs)) {
        rejectAction(world, agent, '생산 조건을 충족하지 못했습니다.')
        continue
      }
      const target = nearestWorkPosition(agent, productionBuilding, blockedCells(world))
      if (keyOf(agent.position) === keyOf(target)) startProcess(world, agent, recipe, storage)
      else moveToward(world, agent, target)
      continue
    }

    if (intent.type === 'GATHER') {
      const node = world.nodes.find((item) => item.id === intent.nodeId)
      const storage = storageById(world, intent.storageId)
      if (!node || !storage) {
        rejectAction(world, agent, '채집 대상이나 저장소가 유효하지 않습니다.')
        continue
      }
      const target = nearestWorkPosition(agent, node, blockedCells(world))
      if (keyOf(agent.position) === keyOf(target)) startGather(agent, node, storage.id)
      else moveToward(world, agent, target)
      continue
    }

    if (intent.type === 'LAUNCH') {
      const building = world.buildings.find((item) => item.id === LAUNCH_CONFIG.buildingId)
      const storage = storageById(world, world.launch.storageId)
      const { resource, amount } = LAUNCH_CONFIG.fuel
      if (world.launch.status !== 'READY' || !storage || storage.resources[resource] < amount) {
        rejectAction(world, agent, '로켓 발사 조건을 충족하지 못했습니다.')
        continue
      }
      const target = nearestWorkPosition(agent, building, blockedCells(world))
      if (keyOf(agent.position) === keyOf(target)) startLaunch(world, agent, building, storage)
      else moveToward(world, agent, target)
      continue
    }

    if (intent.type === 'MOVE') {
      const target = intent.target
      const valid = Number.isInteger(target?.x) && Number.isInteger(target?.y)
        && target.x >= 0 && target.x < SIMULATION_CONFIG.width
        && target.y >= 0 && target.y < SIMULATION_CONFIG.height
        && !blockedCells(world).has(keyOf(target))
      if (valid) moveToward(world, agent, target)
      else rejectAction(world, agent, '이동 좌표가 유효하지 않습니다.')
      continue
    }

    if (intent.type === 'ABANDON') {
      abandonCommitment(agent)
      continue
    }

    if (intent.type === 'WAIT') {
      agent.action = { type: 'WAIT', detail: '다음 결정을 기다리는 중' }
      continue
    }

    rejectAction(world, agent, `지원하지 않는 행동 ${intent.type ?? 'UNKNOWN'}입니다.`)
  }

  crews.forEach((crew, buildingId) => {
    const building = world.buildings.find((item) => item.id === buildingId)
    building.workRemaining = Math.max(0, building.workRemaining - crew.length)
    if (building.workRemaining === 0) {
      building.status = 'COMPLETE'
      crew.forEach((agent) => { agent.stats.built += 1 })
      addEvent(world, 'BUILD', `${building.name} 건설이 완료되었습니다.`)
      addBuildingStorage(world, building)
      revealNextTier(world)
    }
  })

  return finishTick(world)
}

export function stepWorld(currentWorld) {
  return resolveTick(currentWorld, selectDefaultActions(currentWorld))
}

export function getFrontier(world) {
  return currentFrontier(world)
}
