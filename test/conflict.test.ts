import assert from 'node:assert/strict'
import test from 'node:test'
import { createExperimentConfig } from '../src/config/experiment.ts'
import { resolveTick } from '../src/simulation/engine.ts'
import { workPositions } from '../src/simulation/spatial.ts'
import { createWorld } from '../src/simulation/worldFactory.ts'

function resolveBuildConflict(agentSeed, worldSeed = 1) {
  const world = createWorld({ experimentConfig: createExperimentConfig({ experiment: { worldSeed, agentSeed } }) })
  const building = world.buildings.find((item) => item.id === 'workshop')
  building.position = { x: 19, y: 15 }
  building.storageId = world.camp.id
  const position = workPositions(building)[0]
  world.storages[0].resources.Wood = 10
  world.storages[0].resources.Stone = 4
  world.agents.forEach((agent) => { agent.position = structuredClone(position) })
  const actions = world.agents.map((agent) => ({ agentId: agent.id, type: 'BUILD', buildingId: building.id }))
  return resolveTick(world, actions).agents.find((agent) => agent.action.type === 'BUILD').id
}

test('충돌 우선순위는 같은 Agent Seed에서 결정적이다', () => {
  assert.equal(resolveBuildConflict(1), resolveBuildConflict(1))
})

test('Agent Seed가 달라지면 충돌 우선순위가 달라질 수 있다', () => {
  const winners = new Set(Array.from({ length: 12 }, (_, seed) => resolveBuildConflict(seed)))
  assert.ok(winners.size > 1)
})

test('World Seed는 충돌 우선순위를 바꾸지 않는다', () => {
  assert.equal(resolveBuildConflict(1, 1), resolveBuildConflict(1, 2))
})
