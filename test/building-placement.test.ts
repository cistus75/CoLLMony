import assert from 'node:assert/strict'
import test from 'node:test'
import { SIMULATION_CONFIG } from '../src/config/simulation.ts'
import { resolveTick } from '../src/simulation/engine.ts'
import { buildingPlacementError, workPositions } from '../src/simulation/spatial.ts'
import { createWorld } from '../src/simulation/worldFactory.ts'

function validPosition(world, building) {
  return Array.from({ length: SIMULATION_CONFIG.width * SIMULATION_CONFIG.height }, (_, index) => ({
    x: index % SIMULATION_CONFIG.width,
    y: Math.floor(index / SIMULATION_CONFIG.width),
  })).find((position) => !buildingPlacementError(world, building, position))
}

test('최초 BUILD는 합법적인 좌표와 저장소를 고정하고 이후에는 둘 없이 계속한다', () => {
  const world = createWorld()
  const building = world.buildings.find((item) => item.id === 'workshop')
  const position = validPosition(world, building)
  const storage = world.storages[0]
  storage.resources.Wood = building.inputs.Wood
  storage.resources.Stone = building.inputs.Stone

  const placed = resolveTick(world, [{ agentId: 1, type: 'BUILD', buildingId: building.id, position, storageId: storage.id }])
  const placedBuilding = placed.buildings.find((item) => item.id === building.id)
  assert.deepEqual(placedBuilding.position, position)
  assert.equal(placedBuilding.storageId, storage.id)
  assert.ok(placed.log.some((event) => event.type === 'BUILD_SITE'))

  placed.agents[0].position = workPositions(placedBuilding)[0]
  const started = resolveTick(placed, [{ agentId: 1, type: 'BUILD', buildingId: building.id }])
  assert.equal(started.buildings.find((item) => item.id === building.id).status, 'UNDER_CONSTRUCTION')
})

test('잘못된 건물 배치는 이동 보정 없이 거부한다', () => {
  const world = createWorld()
  const building = world.buildings.find((item) => item.id === 'workshop')
  const actions = [
    { agentId: 1, type: 'BUILD', buildingId: building.id },
    { agentId: 1, type: 'BUILD', buildingId: building.id, position: validPosition(world, building), storageId: 'missing' },
    { agentId: 1, type: 'BUILD', buildingId: building.id, position: { x: -1, y: 0 }, storageId: world.camp.id },
    { agentId: 1, type: 'BUILD', buildingId: building.id, position: world.camp.position, storageId: world.camp.id },
    { agentId: 1, type: 'BUILD', buildingId: building.id, position: world.nodes[0].position, storageId: world.camp.id },
  ]

  actions.forEach((action) => {
    const next = resolveTick(world, [action])
    assert.equal(next.buildings.find((item) => item.id === building.id).position, null)
    assert.equal(next.log.at(-1).type, 'INVALID')
  })
})

test('최초 BUILD는 선택한 저장소가 부족해도 다른 저장소로 대체하지 않는다', () => {
  const world = createWorld()
  const building = world.buildings.find((item) => item.id === 'workshop')
  const warehouseResources = structuredClone(world.storages[0].resources)
  warehouseResources.Wood = building.inputs.Wood
  warehouseResources.Stone = building.inputs.Stone
  world.storages.push({
    id: 'warehouse',
    name: '창고',
    position: { x: 15, y: 15 },
    size: { width: 2, height: 2 },
    resources: warehouseResources,
  })
  const next = resolveTick(world, [{
    agentId: 1,
    type: 'BUILD',
    buildingId: building.id,
    position: validPosition(world, building),
    storageId: world.camp.id,
  }])

  const rejected = next.buildings.find((item) => item.id === building.id)
  assert.equal(rejected.position, null)
  assert.equal(rejected.storageId, null)
  assert.equal(next.log.at(-1).type, 'INVALID')
})

test('고정된 건설 위치를 다른 BUILD 의도가 바꾸지 못한다', () => {
  const world = createWorld()
  const building = world.buildings.find((item) => item.id === 'workshop')
  const position = validPosition(world, building)
  world.storages[0].resources.Wood = building.inputs.Wood
  world.storages[0].resources.Stone = building.inputs.Stone
  const placed = resolveTick(world, [{ agentId: 1, type: 'BUILD', buildingId: building.id, position, storageId: world.camp.id }])
  const next = resolveTick(placed, [{ agentId: 1, type: 'BUILD', buildingId: building.id, position: { x: position.x + 1, y: position.y } }])

  assert.deepEqual(next.buildings.find((item) => item.id === building.id).position, position)
  assert.equal(next.log.at(-1).type, 'INVALID')
})

test('고정된 건설 저장소를 다른 BUILD 의도가 바꾸지 못한다', () => {
  const world = createWorld()
  const building = world.buildings.find((item) => item.id === 'workshop')
  const position = validPosition(world, building)
  world.storages[0].resources.Wood = building.inputs.Wood
  world.storages[0].resources.Stone = building.inputs.Stone
  const placed = resolveTick(world, [{ agentId: 1, type: 'BUILD', buildingId: building.id, position, storageId: world.camp.id }])
  placed.storages.push({
    id: 'warehouse',
    name: '창고',
    position: { x: 15, y: 15 },
    size: { width: 2, height: 2 },
    resources: structuredClone(placed.storages[0].resources),
  })
  const next = resolveTick(placed, [{ agentId: 1, type: 'BUILD', buildingId: building.id, storageId: 'warehouse' }])

  assert.equal(next.buildings.find((item) => item.id === building.id).storageId, world.camp.id)
  assert.equal(next.log.at(-1).type, 'INVALID')
})

test('기존 건물과 겹치거나 작업 셀이 없는 배치를 거부한다', () => {
  const world = createWorld()
  const workshop = world.buildings.find((item) => item.id === 'workshop')
  const kiln = world.buildings.find((item) => item.id === 'kiln')
  const position = validPosition(world, workshop)
  workshop.position = position
  kiln.status = 'REVEALED'
  assert.ok(buildingPlacementError(world, kiln, position))

  const enclosed = createWorld()
  const candidate = { x: 10, y: 10 }
  enclosed.nodes = [
    { id: 'north', resource: 'Wood', position: { x: 10, y: 9 } },
    { id: 'east', resource: 'Wood', position: { x: 12, y: 10 } },
    { id: 'south', resource: 'Wood', position: { x: 11, y: 12 } },
    { id: 'west', resource: 'Wood', position: { x: 9, y: 11 } },
  ]
  assert.ok(buildingPlacementError(enclosed, enclosed.buildings[0], candidate))
})

test('공개되지 않은 건물은 배치할 수 없다', () => {
  const world = createWorld()
  const locked = world.buildings.find((item) => item.status === 'LOCKED')
  const next = resolveTick(world, [{ agentId: 1, type: 'BUILD', buildingId: locked.id, position: validPosition(world, locked), storageId: world.camp.id }])
  assert.equal(next.buildings.find((item) => item.id === locked.id).position, null)
  assert.equal(next.log.at(-1).type, 'INVALID')
})
