import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveTick } from '../src/simulation/engine.ts'
import { workPositions } from '../src/simulation/spatial.ts'
import { createWorld } from '../src/simulation/worldFactory.ts'

test('Storage 인접 위치에서도 DELIVER intent가 있어야 한 Tick에 전달한다', () => {
  const world = createWorld()
  const agent = world.agents[0]
  const storage = world.storages[0]
  agent.position = workPositions(storage)[0]
  agent.cargo = { type: 'Wood', amount: 2, storageId: storage.id }

  const waiting = resolveTick(world, [{ agentId: agent.id, type: 'WAIT' }])
  assert.equal(waiting.agents[0].cargo.amount, 2)
  assert.equal(waiting.storages[0].resources.Wood, 0)

  const delivered = resolveTick(world, [{ agentId: agent.id, type: 'DELIVER', storageId: storage.id }])
  assert.equal(delivered.agents[0].cargo.amount, 0)
  assert.equal(delivered.storages[0].resources.Wood, 2)
  assert.equal(delivered.log.at(-1).type, 'DELIVER')
})
