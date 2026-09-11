import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveTick } from '../src/simulation/engine.js'
import { createWorld } from '../src/simulation/worldFactory.js'

test('Agents는 서로를 막지 않고 같은 셀을 점유할 수 있다', () => {
  const world = createWorld()
  world.agents[0].position = { x: 1, y: 1 }
  world.agents[1].position = { x: 0, y: 1 }

  const next = resolveTick(world, [{ agentId: 2, type: 'MOVE', target: { x: 1, y: 1 } }])

  assert.deepEqual(next.agents[0].position, { x: 1, y: 1 })
  assert.deepEqual(next.agents[1].position, { x: 1, y: 1 })
})
