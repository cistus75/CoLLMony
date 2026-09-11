import assert from 'node:assert/strict'
import test from 'node:test'
import { createExperimentConfig } from '../src/config/experiment.ts'
import { resolveTick } from '../src/simulation/engine.ts'
import { createAgentObservation } from '../src/simulation/observation.ts'
import { createWorld } from '../src/simulation/worldFactory.ts'

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
  assert.ok(!Object.hasOwn(observation.sharedTechKnowledge.frontier[0], 'status'))
  assert.ok(!observation.sharedTechKnowledge.frontier.some((building) => building.id === 'kiln'))
})

test('완료 기술과 현재 사용 가능한 생산법은 위치와 무관하게 공유된다', () => {
  const world = createWorld({
    experimentConfig: createExperimentConfig({ observation: { partialObservation: true, fovRadius: 1 } }),
  })
  const kiln = world.buildings.find((building) => building.id === 'kiln')
  kiln.status = 'COMPLETE'
  kiln.position = { x: 20, y: 15 }
  const observation = createAgentObservation(world, 1)

  assert.deepEqual(observation.sharedTechKnowledge.completed, [{ id: 'kiln', name: '제재소', tier: 2 }])
  assert.deepEqual(observation.sharedTechKnowledge.recipes.map((recipe) => recipe.id), ['plank'])
  assert.ok(!observation.physicalObservation.buildings.some((building) => building.id === kiln.id))
  assert.ok(!observation.sharedTechKnowledge.recipes.some((recipe) => recipe.id === 'steel'))
})

test('미배치 건물은 물리 관측에는 없고 Tech Frontier에만 등장한다', () => {
  const world = createWorld({ experimentConfig: createExperimentConfig({ observation: { partialObservation: false } }) })
  const workshop = world.buildings.find((building) => building.id === 'workshop')
  const observation = createAgentObservation(world, 1)

  assert.equal(workshop.position, null)
  assert.ok(!observation.physicalObservation.buildings.some((building) => building.id === workshop.id))
  assert.deepEqual(observation.sharedTechKnowledge.frontier[0].size, workshop.size)
})

test('배치된 건설 부지는 일반 물리 관측 규칙을 따른다', () => {
  const world = createWorld({ experimentConfig: createExperimentConfig({ observation: { partialObservation: false } }) })
  const workshop = world.buildings.find((building) => building.id === 'workshop')
  world.storages[0].resources.Wood = workshop.inputs.Wood
  world.storages[0].resources.Stone = workshop.inputs.Stone
  const placed = resolveTick(world, [{ agentId: 1, type: 'BUILD', buildingId: workshop.id, position: { x: 19, y: 15 }, storageId: world.camp.id }])
  const observation = createAgentObservation(placed, 1)

  assert.ok(observation.physicalObservation.buildings.some((building) => building.id === workshop.id))
})

test('self observation은 허용된 Agent 상태만 노출한다', () => {
  const observation = createAgentObservation(createWorld(), 1)
  assert.deepEqual(Object.keys(observation.self), ['id', 'name', 'position', 'action', 'cargo', 'needs', 'persona'])
  assert.ok(!Object.hasOwn(observation.self, 'stats'))
  assert.ok(!Object.hasOwn(observation.self, 'nextDecisionTick'))
})
