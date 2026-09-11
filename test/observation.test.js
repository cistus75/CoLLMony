import assert from 'node:assert/strict'
import test from 'node:test'
import { createExperimentConfig } from '../src/config/experiment.js'
import { createAgentObservation } from '../src/simulation/observation.js'
import { createWorld } from '../src/simulation/worldFactory.js'

function observedAgentIds(partialObservation) {
  const world = createWorld({
    experimentConfig: createExperimentConfig({ observation: { partialObservation, fovRadius: 2 } }),
  })
  world.agents[0].position = { x: 10, y: 10 }
  world.agents[1].position = { x: 12, y: 10 }
  world.agents[2].position = { x: 13, y: 10 }
  return createAgentObservation(world, 1).physicalObservation.agents.map((agent) => agent.id)
}

test('Partial Observation은 활성 Run Config의 FOV를 사용한다', () => {
  assert.ok(observedAgentIds(true).includes(2))
  assert.ok(!observedAgentIds(true).includes(3))
  assert.ok(observedAgentIds(false).includes(3))
})

test('Tech Frontier는 물리 FOV 밖에서도 공유되지만 위치는 노출하지 않는다', () => {
  const world = createWorld({
    experimentConfig: createExperimentConfig({ observation: { partialObservation: true, fovRadius: 1 } }),
  })
  const observation = createAgentObservation(world, 1)

  assert.ok(!observation.physicalObservation.buildings.some((building) => building.id === 'workshop'))
  assert.ok(observation.sharedTechKnowledge.frontier.some((building) => building.id === 'workshop'))
  assert.ok(!Object.hasOwn(observation.sharedTechKnowledge.frontier[0], 'position'))
  assert.ok(!observation.sharedTechKnowledge.frontier.some((building) => building.id === 'kiln'))
})

test('self observation은 허용된 Agent 상태만 노출한다', () => {
  const observation = createAgentObservation(createWorld(), 1)
  assert.deepEqual(Object.keys(observation.self), ['id', 'name', 'position', 'action', 'cargo', 'needs', 'persona'])
  assert.ok(!Object.hasOwn(observation.self, 'stats'))
  assert.ok(!Object.hasOwn(observation.self, 'nextDecisionTick'))
})
