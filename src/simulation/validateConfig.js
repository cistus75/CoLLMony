import {
  ACTION_CONFIG,
  AGENT_CONFIG,
  BUILDING_BLUEPRINTS,
  CAMP_CONFIG,
  EXPERIMENT_LIMITS,
  LAUNCH_CONFIG,
  PROCESS_RECIPES,
  RESOURCE_CONFIG,
  RESOURCE_NODES,
  SIMULATION_CONFIG,
  STORAGE_CONFIG,
  TECH_CONFIG,
} from '../config/simulation.js'
import { footprintCells, keyOf, workPositions } from './spatial.js'

function assertConfig(condition, message) {
  if (!condition) throw new Error(`[simulation config] ${message}`)
}

function assertUnique(items, label) {
  const ids = items.map((item) => item.id)
  assertConfig(new Set(ids).size === ids.length, `${label} id가 중복되었습니다.`)
}

function assertResourceMap(resources, resourceIds, label) {
  Object.entries(resources).forEach(([resource, amount]) => {
    assertConfig(resourceIds.has(resource), `${label}에서 알 수 없는 자원 ${resource}를 참조합니다.`)
    assertConfig(Number.isFinite(amount) && amount > 0, `${label}의 ${resource} 수량은 0보다 커야 합니다.`)
  })
}

export function validateSimulationConfig() {
  const resourceIds = new Set(Object.keys(RESOURCE_CONFIG))
  const buildingIds = new Set(BUILDING_BLUEPRINTS.map((building) => building.id))
  const resourceCodes = Object.values(RESOURCE_CONFIG).map((resource) => resource.code)

  assertUnique(RESOURCE_NODES, '자원 노드')
  assertUnique(BUILDING_BLUEPRINTS, '건물')
  assertUnique(PROCESS_RECIPES, '생산법')
  assertConfig(new Set(resourceCodes).size === resourceCodes.length, '자원 코드가 중복되었습니다.')
  assertConfig(new Set(PROCESS_RECIPES.map((recipe) => recipe.output.resource)).size === PROCESS_RECIPES.length, '한 자원에 여러 생산법을 지정할 수 없습니다.')
  assertConfig(EXPERIMENT_LIMITS.agentCount.max <= AGENT_CONFIG.names.length, '최대 Agent 수보다 이름 설정이 적습니다.')
  assertConfig(EXPERIMENT_LIMITS.agentCount.max <= AGENT_CONFIG.startPositions.length, '최대 Agent 수보다 시작 위치 설정이 적습니다.')

  RESOURCE_NODES.forEach((node) => {
    assertConfig(resourceIds.has(node.resource), `${node.id} 노드의 자원 ${node.resource}가 없습니다.`)
    assertConfig(Number.isFinite(RESOURCE_CONFIG[node.resource].gatherDuration), `${node.resource}는 채집 가능한 자원이어야 합니다.`)
  })

  Object.entries(RESOURCE_CONFIG).forEach(([resource, meta]) => {
    if (meta.kind === 'survival' || meta.kind === 'raw') {
      assertConfig(RESOURCE_NODES.some((node) => node.resource === resource), `${resource} 자원 노드가 없습니다.`)
    }
  })

  BUILDING_BLUEPRINTS.forEach((building) => {
    assertConfig(Number.isFinite(ACTION_CONFIG.BUILD[building.tier]), `${building.name}의 Tier ${building.tier} 건설 시간이 없습니다.`)
    assertResourceMap(building.inputs, resourceIds, `${building.name} 건설 비용`)
  })

  Object.entries(TECH_CONFIG.buildingCounts).forEach(([tier, expected]) => {
    const actual = BUILDING_BLUEPRINTS.filter((building) => building.tier === Number(tier)).length
    assertConfig(actual === expected, `Tier ${tier} 건물은 ${expected}개여야 하지만 ${actual}개입니다.`)
  })

  PROCESS_RECIPES.forEach((recipe) => {
    assertConfig(buildingIds.has(recipe.requires), `${recipe.name}이 알 수 없는 건물 ${recipe.requires}를 참조합니다.`)
    assertResourceMap(recipe.inputs, resourceIds, `${recipe.name} 투입 자원`)
    assertResourceMap({ [recipe.output.resource]: recipe.output.amount }, resourceIds, `${recipe.name} 생산 자원`)
  })

  const obtainable = new Set(RESOURCE_NODES.map((node) => node.resource))
  Object.keys(TECH_CONFIG.buildingCounts).map(Number).toSorted((a, b) => a - b).forEach((tier) => {
    let changed = true
    while (changed) {
      changed = false
      PROCESS_RECIPES.filter((recipe) => BUILDING_BLUEPRINTS.find((building) => building.id === recipe.requires).tier < tier).forEach((recipe) => {
        if (!obtainable.has(recipe.output.resource) && Object.keys(recipe.inputs).every((resource) => obtainable.has(resource))) {
          obtainable.add(recipe.output.resource)
          changed = true
        }
      })
    }
    BUILDING_BLUEPRINTS.filter((building) => building.tier === tier).forEach((building) => {
      Object.keys(building.inputs).forEach((resource) => {
        assertConfig(obtainable.has(resource), `${building.name} 건설에 필요한 ${resource}를 Tier ${tier} 전에 획득할 수 없습니다.`)
      })
    })
  })

  assertResourceMap(STORAGE_CONFIG.initialResources, resourceIds, '초기 창고')
  assertConfig(buildingIds.has(LAUNCH_CONFIG.buildingId), '발사대 설정이 유효하지 않습니다.')
  assertConfig(buildingIds.has(LAUNCH_CONFIG.spacecraftId), '로켓 설정이 유효하지 않습니다.')
  assertConfig(BUILDING_BLUEPRINTS.find((building) => building.id === LAUNCH_CONFIG.buildingId)?.tier === 5, '발사대는 Tier 5 건물이어야 합니다.')
  assertConfig(BUILDING_BLUEPRINTS.find((building) => building.id === LAUNCH_CONFIG.spacecraftId)?.tier === 5, '로켓은 Tier 5 건물이어야 합니다.')
  assertResourceMap({ [LAUNCH_CONFIG.fuel.resource]: LAUNCH_CONFIG.fuel.amount }, resourceIds, '발사 연료')
  assertConfig(obtainable.has(LAUNCH_CONFIG.fuel.resource), `발사 연료 ${LAUNCH_CONFIG.fuel.resource}를 생산할 수 없습니다.`)

  const occupied = new Map()
  const entities = [CAMP_CONFIG, ...RESOURCE_NODES, ...BUILDING_BLUEPRINTS]
  entities.forEach((entity) => {
    const size = entity.size ?? { width: 1, height: 1 }
    assertConfig(Number.isInteger(entity.position.x) && Number.isInteger(entity.position.y), `${entity.name ?? entity.id}의 좌표는 정수여야 합니다.`)
    assertConfig(Number.isInteger(size.width) && size.width > 0 && Number.isInteger(size.height) && size.height > 0, `${entity.name ?? entity.id}의 크기는 양의 정수여야 합니다.`)
    footprintCells(entity).forEach((cell) => {
      assertConfig(cell.x >= 0 && cell.x < SIMULATION_CONFIG.width && cell.y >= 0 && cell.y < SIMULATION_CONFIG.height, `${entity.name ?? entity.id}가 맵 경계를 벗어납니다.`)
      const key = keyOf(cell)
      assertConfig(!occupied.has(key), `${entity.name ?? entity.id}와 ${occupied.get(key)}가 ${key} 셀에서 겹칩니다.`)
      occupied.set(key, entity.name ?? entity.id)
    })
  })

  entities.forEach((entity) => {
    assertConfig(workPositions(entity).some((position) => !occupied.has(keyOf(position))), `${entity.name ?? entity.id}에 접근 가능한 작업 셀이 없습니다.`)
  })

  AGENT_CONFIG.startPositions.forEach((position, index) => {
    assertConfig(position.x >= 0 && position.x < SIMULATION_CONFIG.width && position.y >= 0 && position.y < SIMULATION_CONFIG.height, `Agent ${AGENT_CONFIG.names[index]}의 시작 위치가 맵 경계를 벗어납니다.`)
    assertConfig(!occupied.has(`${position.x},${position.y}`), `Agent ${AGENT_CONFIG.names[index]}의 시작 위치가 오브젝트와 겹칩니다.`)
  })
}
