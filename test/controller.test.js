import assert from 'node:assert/strict'
import test from 'node:test'
import { stepWorld } from '../src/simulation/engine.js'
import { createWorld } from '../src/simulation/worldFactory.js'

test('Controller가 observation으로 intent를 선택하고 resolver가 결과를 소유한다', () => {
  const world = createWorld()
  let receivedObservations
  const controller = {
    decide(observations) {
      receivedObservations = observations
      return observations.map(({ self }) => ({ agentId: self.id, type: 'WAIT' }))
    },
  }

  const next = stepWorld(world, controller)

  assert.equal(receivedObservations.length, world.agents.length)
  assert.equal(next.tick, 1)
  assert.ok(next.agents.every((agent) => agent.action.type === 'WAIT'))
})

test('지속 작업은 Controller 재호출 없이 엔진이 진행한다', () => {
  const world = createWorld()
  world.agents = world.agents.slice(0, 1)
  const node = world.nodes.find((item) => item.id === 'food')
  world.agents[0].position = { x: node.position.x - 1, y: node.position.y }
  const started = stepWorld(world, {
    decide() {
      return [{ agentId: 1, type: 'GATHER', nodeId: node.id, storageId: world.camp.id }]
    },
  })
  let calls = 0
  const controller = {
    decide() {
      calls += 1
      return [{ agentId: 1, type: 'WAIT' }]
    },
  }

  const completed = stepWorld(started, controller)
  assert.equal(calls, 0)
  assert.equal(completed.agents[0].cargo.amount, 1)

  stepWorld(completed, controller)
  assert.equal(calls, 1)
})

test('잘못된 Controller 반환값은 World resolver를 중단시키지 않는다', () => {
  const world = createWorld()
  const next = stepWorld(world, { decide: () => null })
  assert.equal(next.tick, 1)
  assert.ok(next.agents.every((agent) => agent.action.type === 'WAIT'))
})
