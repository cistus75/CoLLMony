import assert from 'node:assert/strict'
import test from 'node:test'
import { LAUNCH_CONFIG } from '../src/config/world.ts'
import { resolveTick } from '../src/simulation/engine.ts'
import { workPositions } from '../src/simulation/spatial.ts'
import { createWorld } from '../src/simulation/worldFactory.ts'

function launchReadyWorld(fuelAmount) {
  const world = createWorld()
  const launchpad = world.buildings.find((building) => building.id === LAUNCH_CONFIG.buildingId)
  const rocket = world.buildings.find((building) => building.id === LAUNCH_CONFIG.spacecraftId)
  launchpad.position = { x: 19, y: 25 }
  launchpad.status = 'COMPLETE'
  rocket.status = 'COMPLETE'
  world.launch = { status: 'READY', actorId: null, storageId: world.camp.id, remaining: 0 }
  world.storages[0].resources[LAUNCH_CONFIG.fuel.resource] = fuelAmount
  world.agents[0].position = workPositions(launchpad)[0]
  return world
}

test('연료가 부족한 LAUNCH는 거부되고 Episode가 계속된다', () => {
  const world = launchReadyWorld(LAUNCH_CONFIG.fuel.amount - 1)
  const next = resolveTick(world, [{ agentId: 1, type: 'LAUNCH' }])
  assert.equal(next.status, 'RUNNING')
  assert.equal(next.launch.status, 'READY')
  assert.equal(next.storages[0].resources[LAUNCH_CONFIG.fuel.resource], LAUNCH_CONFIG.fuel.amount - 1)
})

test('발사대와 로켓이 완공되지 않으면 READY 상태여도 LAUNCH를 거부한다', () => {
  const world = launchReadyWorld(LAUNCH_CONFIG.fuel.amount)
  world.buildings.find((building) => building.id === LAUNCH_CONFIG.spacecraftId).status = 'UNDER_CONSTRUCTION'
  const next = resolveTick(world, [{ agentId: 1, type: 'LAUNCH' }])
  assert.equal(next.status, 'RUNNING')
  assert.equal(next.launch.status, 'READY')
})

test('모든 조건을 갖춘 LAUNCH는 연료를 소비하고 성공한다', () => {
  const world = launchReadyWorld(LAUNCH_CONFIG.fuel.amount)
  const next = resolveTick(world, [{ agentId: 1, type: 'LAUNCH' }])
  assert.equal(next.status, 'SUCCESS')
  assert.equal(next.launch.status, 'COMPLETE')
  assert.equal(next.storages[0].resources[LAUNCH_CONFIG.fuel.resource], 0)
})
