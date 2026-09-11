import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveTick } from '../src/simulation/engine.ts'
import { createWorld } from '../src/simulation/worldFactory.ts'

test('GATHER는 설정된 두 Tick 후 한 단위를 생산한다', () => {
  const world = createWorld()
  const node = world.nodes.find((item) => item.id === 'food')
  world.agents[0].position = { x: node.position.x - 1, y: node.position.y }

  const started = resolveTick(world, [{ agentId: 1, type: 'GATHER', nodeId: node.id, storageId: world.camp.id }])
  assert.equal(started.agents[0].cargo.amount, 0)
  assert.equal(started.agents[0].gather.remaining, 1)

  const completed = resolveTick(started, [{ agentId: 1, type: 'CONTINUE' }])
  assert.equal(completed.agents[0].gather, null)
  assert.deepEqual(completed.agents[0].cargo, { type: 'Food', amount: 1, storageId: world.camp.id })
})
