import assert from 'node:assert/strict'
import test from 'node:test'
import { createExperimentConfig } from '../src/config/experiment.js'
import { resolveTick } from '../src/simulation/engine.js'
import { workPositions } from '../src/simulation/spatial.js'
import { createWorld } from '../src/simulation/worldFactory.js'

function resolveBuildConflict(worldSeed) {
  const world = createWorld({ experimentConfig: createExperimentConfig({ experiment: { worldSeed } }) })
  const building = world.buildings.find((item) => item.id === 'workshop')
  const position = workPositions(building)[0]
  world.storages[0].resources.Wood = 10
  world.storages[0].resources.Stone = 4
  world.agents.forEach((agent) => { agent.position = structuredClone(position) })
  const actions = world.agents.map((agent) => ({ agentId: agent.id, type: 'BUILD', buildingId: building.id }))
  return resolveTick(world, actions).agents.find((agent) => agent.action.type === 'BUILD').id
}

test('충돌 우선순위는 같은 World Seed에서 결정적이다', () => {
  assert.equal(resolveBuildConflict(1), resolveBuildConflict(1))
})

test('World Seed가 달라지면 충돌 우선순위가 달라질 수 있다', () => {
  const winners = new Set(Array.from({ length: 12 }, (_, seed) => resolveBuildConflict(seed)))
  assert.ok(winners.size > 1)
})
