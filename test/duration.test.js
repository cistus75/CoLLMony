import assert from 'node:assert/strict'
import test from 'node:test'
import { actionDuration, actionDurationMultiplier, resolveTick } from '../src/simulation/engine.js'
import { createWorld } from '../src/simulation/worldFactory.js'

const agentWithNeeds = (food, water) => ({ needs: { food, water } })

test('Food와 Water 중 더 큰 결핍으로 행동 시간을 계산한다', () => {
  assert.equal(actionDurationMultiplier(agentWithNeeds(0, 0)), 1)
  assert.equal(actionDurationMultiplier(agentWithNeeds(-1, 0)), 2)
  assert.equal(actionDurationMultiplier(agentWithNeeds(0, -2)), 3)
  assert.equal(actionDurationMultiplier(agentWithNeeds(-1, -3)), 4)
  assert.equal(actionDuration(agentWithNeeds(-2, -1), 4), 12)
})

test('upkeep을 다시 지불하면 결핍과 다음 행동 배수가 회복된다', () => {
  const world = createWorld()
  world.tick = 23
  world.agents[0].needs = { food: -1, water: -1 }
  world.storages[0].resources.Food = 1
  world.storages[0].resources.Water = 1

  const next = resolveTick(world, [{ agentId: 1, type: 'WAIT' }])

  assert.deepEqual(next.agents[0].needs, { food: 0, water: 0 })
  assert.equal(actionDurationMultiplier(next.agents[0]), 1)
})

test('결핍 배수를 실제 GATHER 지속 시간에 적용한다', () => {
  const world = createWorld()
  const node = world.nodes.find((item) => item.id === 'food')
  world.agents[0].position = { x: node.position.x - 1, y: node.position.y }
  world.agents[0].needs.food = -1

  const started = resolveTick(world, [{ agentId: 1, type: 'GATHER', nodeId: node.id, storageId: world.camp.id }])

  assert.equal(started.agents[0].gather.remaining, 3)
})
