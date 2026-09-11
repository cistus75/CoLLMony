import assert from 'node:assert/strict'
import test from 'node:test'
import { SIMULATION_CONFIG } from '../src/config/world.ts'
import { resolveTick } from '../src/simulation/engine.ts'
import { createWorld } from '../src/simulation/worldFactory.ts'

function worldWithCargo(amount) {
  const world = createWorld()
  const node = world.nodes.find((item) => item.id === 'food')
  world.agents[0].position = { x: node.position.x - 1, y: node.position.y }
  world.agents[0].cargo = { type: 'Food', amount, storageId: world.camp.id }
  return { world, node }
}

test('cargo batch 미만에서는 같은 자원을 더 채집할 수 있다', () => {
  const { world, node } = worldWithCargo(SIMULATION_CONFIG.cargoBatchSize - 1)
  const next = resolveTick(world, [{ agentId: 1, type: 'GATHER', nodeId: node.id, storageId: world.camp.id }])
  assert.ok(next.agents[0].gather)
})

test('cargo batch에 도달하면 추가 채집을 거부한다', () => {
  const { world, node } = worldWithCargo(SIMULATION_CONFIG.cargoBatchSize)
  const next = resolveTick(world, [{ agentId: 1, type: 'GATHER', nodeId: node.id, storageId: world.camp.id }])
  assert.equal(next.agents[0].gather, null)
  assert.equal(next.agents[0].cargo.amount, SIMULATION_CONFIG.cargoBatchSize)
  assert.equal(next.log.at(-1).type, 'INVALID')
})
