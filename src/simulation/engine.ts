import { ACTION_CONFIG, createExperimentConfig, LAUNCH_CONFIG, RESOURCE_CONFIG, SIMULATION_CONFIG, UPKEEP_CONFIG } from '../config/simulation.ts'
import { oracleSmokeController } from './defaultController.ts'
import { seededValue } from './determinism.ts'
import { createObservations } from './observation.ts'
import { blockedCells, buildingPlacementError, createMovePath, distance, keyOf, nearestWorkPosition, workPositions } from './spatial.ts'

export { createWorld } from './worldFactory.ts'
export { createAgentObservation, createObservations } from './observation.ts'
export { createMovePath, distance, footprintCells, workPositions } from './spatial.ts'

export function actionDurationMultiplier(agent) {
  return 1 + Math.max(0, -(Math.min(agent.needs.food, agent.needs.water)))
}

export function actionDuration(agent, baseDuration) {
  return baseDuration * actionDurationMultiplier(agent)
}

function delayNextDecision(world, agent, baseDuration) {
  agent.nextDecisionTick = world.tick + actionDuration(agent, baseDuration)
}

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

function hasInputs(storage, inputs) {
  return storage && Object.entries(inputs).every(([resource, amount]) => storage.resources[resource] >= amount)
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
  delayNextDecision(world, agent, ACTION_CONFIG.MOVE)
}

function startGather(agent, node, storageId) {
  agent.gather = { resource: node.resource, storageId, remaining: actionDuration(agent, RESOURCE_CONFIG[node.resource].gatherDuration) - 1 }
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
  const { type, amount } = agent.cargo
  storage.resources[type] += amount
  agent.cargo = { type: null, amount: 0, storageId: null }
  agent.stats.delivered += amount
  agent.action = { type: 'DELIVER', detail: `${RESOURCE_CONFIG[type].label} ${amount}개 전달 완료` }
  delayNextDecision(world, agent, ACTION_CONFIG.DELIVER)
  addEvent(world, 'DELIVER', `Agent ${agent.name}가 DELIVER로 ${RESOURCE_CONFIG[type].label} ${amount}개를 ${storage.name}에 전달했습니다.`)
}

function startProcess(world, agent, recipe, storage) {
  Object.entries(recipe.inputs).forEach(([resource, amount]) => { storage.resources[resource] -= Number(amount) })
  agent.process = { recipeId: recipe.id, storageId: storage.id, remaining: actionDuration(agent, ACTION_CONFIG.PROCESS) - 1, output: structuredClone(recipe.output) }
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
  })
  addEvent(world, 'TECH', `Tier ${nextTier} 기술이 공개되었습니다.`)
}

function startLaunch(world, agent, building, storage) {
  const { resource, amount } = LAUNCH_CONFIG.fuel
  storage.resources[resource] -= amount
  world.launch = { status: 'IN_PROGRESS', actorId: agent.id, storageId: storage.id, remaining: actionDuration(agent, ACTION_CONFIG.LAUNCH) - 1 }
  agent.action = { type: 'LAUNCH', detail: `${building.name} 발사 절차 진행 중` }
  addEvent(world, 'LAUNCH', `Agent ${agent.name}가 로켓 발사 절차를 시작했습니다.`)
  if (world.launch.remaining === 0) completeLaunch(world, agent)
}

function completeLaunch(world, actor) {
  world.launch.status = 'COMPLETE'
  world.status = 'SUCCESS'
  actor.action = { type: 'LAUNCH', detail: '로켓 발사 성공' }
  addEvent(world, 'LAUNCH', '로켓이 성공적으로 발사되었습니다. Episode가 완료되었습니다.')
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
  completeLaunch(world, actor)
  return true
}

function updateUpkeep(world) {
  if (world.tick % SIMULATION_CONFIG.ticksPerDay !== 0) return
  const storages = world.storages.toSorted((a, b) => a.id.localeCompare(b.id))
  world.agents.forEach((agent) => {
    for (const [resource, amount] of Object.entries(UPKEEP_CONFIG.perAgent)) {
      const field = resource.toLowerCase()
      const storage = storages.find((candidate) => candidate.resources[resource] >= amount)
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
  agent.action = { type: 'WAIT', detail: '진행 중인 작업을 중단함' }
}

function endBuildParticipation(world, agent) {
  if (!agent.buildTargetId) return
  const building = world.buildings.find((item) => item.id === agent.buildTargetId)
  agent.stats.buildAbandons += 1
  agent.buildTargetId = null
  addEvent(world, 'BUILD_ABANDON', `Agent ${agent.name}가 ${building?.name ?? '건물'} 건설 참여를 중단했습니다.`)
}

function agentsInConflict(world, actionByAgent) {
  const conflicted = new Set()
  const buildGroups = new Map()
  const resourceGroups = new Map()
  const requestedBuildings = new Set()
  const launchAgents = []

  world.agents.forEach((agent) => {
    const intent = actionByAgent.get(agent.id)
    if (intent?.type === 'BUILD') {
      const building = world.buildings.find((item) => item.id === intent.buildingId)
      if (!building) return
      const group = buildGroups.get(building.id) ?? []
      group.push({ agentId: agent.id, position: intent.position, storageId: intent.storageId })
      buildGroups.set(building.id, group)
      if (building.status === 'REVEALED' && !requestedBuildings.has(building.id)) {
        requestedBuildings.add(building.id)
        const storageId = building.storageId ?? intent.storageId
        const requests = resourceGroups.get(storageId) ?? []
        requests.push({ agentId: agent.id, inputs: building.inputs })
        resourceGroups.set(storageId, requests)
      }
    }
    if (intent?.type === 'PROCESS') {
      const recipe = world.recipes.find((item) => item.id === intent.recipeId)
      if (!recipe) return
      const requests = resourceGroups.get(intent.storageId) ?? []
      requests.push({ agentId: agent.id, inputs: recipe.inputs })
      resourceGroups.set(intent.storageId, requests)
    }
    if (intent?.type === 'LAUNCH') launchAgents.push(agent.id)
  })

  buildGroups.forEach((requests, buildingId) => {
    const building = world.buildings.find((item) => item.id === buildingId)
    const positions = new Set(requests.map(({ position }) => position && keyOf(position)).filter(Boolean))
    const storageIds = new Set(requests.map(({ storageId }) => storageId).filter(Boolean))
    const candidate = building.position ? building : { ...building, position: requests[0]?.position }
    if (positions.size > 1 || (!building.position && storageIds.size > 1) || requests.length > workPositions(candidate, blockedCells(world)).length) {
      requests.forEach(({ agentId }) => conflicted.add(agentId))
    }
  })

  resourceGroups.forEach((requests, storageId) => {
    const storage = storageById(world, storageId)
    if (!storage) return
    const totals = requests.reduce((result, request) => {
      Object.entries(request.inputs).forEach(([resource, amount]) => { result[resource] = (result[resource] ?? 0) + amount })
      return result
    }, {})
    const scarce = new Set(Object.entries(totals).filter(([resource, amount]) => storage.resources[resource] < amount).map(([resource]) => resource))
    requests.filter((request) => Object.keys(request.inputs).some((resource) => scarce.has(resource))).forEach((request) => conflicted.add(request.agentId))
  })

  if (world.launch.status === 'READY' && launchAgents.length > 1) launchAgents.forEach((agentId) => conflicted.add(agentId))
  return conflicted
}

function resolutionOrder(world, actionByAgent) {
  const conflicted = agentsInConflict(world, actionByAgent)
  const ranked = world.agents
    .filter((agent) => conflicted.has(agent.id))
    .toSorted((a, b) => seededValue(world.run.config.experiment.agentSeed, world.tick, a.id) - seededValue(world.run.config.experiment.agentSeed, world.tick, b.id))
  let cursor = 0
  return world.agents.map((agent) => conflicted.has(agent.id) ? ranked[cursor++] : agent)
}

export function resolveTick(currentWorld, actions = []) {
  if (currentWorld.status !== 'RUNNING') return currentWorld
  const world = structuredClone(currentWorld)
  world.run.config = createExperimentConfig(currentWorld.run.config)
  world.tick += 1
  world.agents.forEach((agent) => { agent.movePath = [] })

  if (continueLaunch(world)) return finishTick(world)

  const validActions = Array.isArray(actions) ? actions.filter((action) => action && Number.isInteger(action.agentId)) : []
  const actionByAgent = new Map(validActions.map((action) => [action.agentId, action]))
  const crews = new Map()
  const claimedWorkPositions = new Map()

  for (const agent of resolutionOrder(world, actionByAgent)) {
    const intent = actionByAgent.get(agent.id) ?? { type: 'WAIT' }
    if (agent.buildTargetId && (intent.type !== 'BUILD' || intent.buildingId !== agent.buildTargetId)) endBuildParticipation(world, agent)
    if (agent.nextDecisionTick > world.tick) {
      agent.action = { type: 'WAIT', detail: `행동 회복 중 · ${agent.nextDecisionTick - world.tick}틱` }
      continue
    }
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
        else moveToward(world, agent, target)
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
      if (!building.position) {
        const storage = storageById(world, intent.storageId)
        if (!storage) {
          rejectAction(world, agent, '존재하지 않는 저장소입니다.')
          continue
        }
        const placementError = buildingPlacementError(world, building, intent.position)
        if (placementError) {
          rejectAction(world, agent, placementError)
          continue
        }
        if (!hasInputs(storage, building.inputs)) {
          rejectAction(world, agent, `${building.name} 건설 자원이 부족합니다.`)
          continue
        }
        building.position = structuredClone(intent.position)
        building.storageId = storage.id
        addEvent(world, 'BUILD_SITE', `${building.name} 건설 위치가 (${building.position.x}, ${building.position.y})로 고정되었습니다.`)
      } else if (intent.position && keyOf(intent.position) !== keyOf(building.position)) {
        rejectAction(world, agent, `${building.name} 건설 위치는 이미 고정되었습니다.`)
        continue
      } else if (intent.storageId && intent.storageId !== building.storageId) {
        rejectAction(world, agent, `${building.name} 건설 저장소는 이미 고정되었습니다.`)
        continue
      }
      const storage = storageById(world, building.storageId)
      if (!storage) {
        rejectAction(world, agent, '존재하지 않는 저장소입니다.')
        continue
      }
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
          Object.entries(building.inputs).forEach(([resource, amount]) => { storage.resources[resource] -= Number(amount) })
          building.status = 'UNDER_CONSTRUCTION'
          addEvent(world, 'BUILD', `${building.name} 건설이 시작되었습니다.`)
        }
        agent.action = { type: 'BUILD', detail: `${building.name} 건설 중` }
        agent.buildTargetId = building.id
        agent.stats.buildTicks += 1
        const crew = crews.get(building.id) ?? []
        crew.push(agent)
        crews.set(building.id, crew)
      } else {
        endBuildParticipation(world, agent)
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
      const spacecraft = world.buildings.find((item) => item.id === LAUNCH_CONFIG.spacecraftId)
      const storage = storageById(world, world.launch.storageId)
      const { resource, amount } = LAUNCH_CONFIG.fuel
      if (world.launch.status !== 'READY' || building?.status !== 'COMPLETE' || spacecraft?.status !== 'COMPLETE' || !storage || storage.resources[resource] < amount) {
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
      delayNextDecision(world, agent, ACTION_CONFIG.WAIT)
      continue
    }

    if (intent.type === 'WAIT') {
      agent.action = { type: 'WAIT', detail: '다음 결정을 기다리는 중' }
      delayNextDecision(world, agent, ACTION_CONFIG.WAIT)
      continue
    }

    rejectAction(world, agent, `지원하지 않는 행동 ${intent.type ?? 'UNKNOWN'}입니다.`)
  }

  crews.forEach((crew, buildingId) => {
    const building = world.buildings.find((item) => item.id === buildingId)
    const contribution = crew.reduce((total, agent) => total + (1 / actionDurationMultiplier(agent)), 0)
    building.workRemaining = Math.max(0, building.workRemaining - contribution)
    if (building.workRemaining === 0) {
      building.status = 'COMPLETE'
      crew.forEach((agent) => {
        agent.buildTargetId = null
        agent.stats.built += 1
      })
      addEvent(world, 'BUILD', `${building.name} 건설이 완료되었습니다.`)
      addBuildingStorage(world, building)
      revealNextTier(world)
    }
  })

  return finishTick(world)
}

function automaticAction(world, agent) {
  if (world.launch.status === 'IN_PROGRESS' || agent.nextDecisionTick > world.tick + 1) return null
  if (agent.gather || agent.process) return { agentId: agent.id, type: 'CONTINUE' }
  if (agent.buildTargetId) return { agentId: agent.id, type: 'BUILD', buildingId: agent.buildTargetId }
  return undefined
}

export function stepWorld(currentWorld, controller = oracleSmokeController, recorder) {
  const automaticActions = currentWorld.agents.map((agent) => automaticAction(currentWorld, agent))
  const decisionAgentIds = currentWorld.agents
    .filter((_, index) => automaticActions[index] === undefined)
    .map((agent) => agent.id)
  const observations = createObservations(currentWorld, decisionAgentIds)
  const decisions = observations.length ? controller.decide(observations, { world: currentWorld }) : []
  const actions = [...automaticActions.filter(Boolean), ...(Array.isArray(decisions) ? decisions : [])]
  const nextWorld = resolveTick(currentWorld, actions)
  recorder?.recordTick({ before: currentWorld, after: nextWorld, observations, actions, controllerId: controller.id ?? null })
  return nextWorld
}

export function getFrontier(world) {
  return currentFrontier(world)
}
