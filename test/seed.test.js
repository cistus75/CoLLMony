import assert from 'node:assert/strict'
import test from 'node:test'
import { createExperimentConfig } from '../src/config/experiment.js'
import { createWorld } from '../src/simulation/worldFactory.js'

const worldFor = (worldSeed, agentSeed) => createWorld({
  experimentConfig: createExperimentConfig({ experiment: { worldSeed, agentSeed } }),
})

test('World Seed와 Agent Seed를 독립적으로 재현한다', () => {
  const baseline = worldFor(1, 1)
  const repeated = worldFor(1, 1)
  const changedWorldSeed = worldFor(2, 1)
  const changedAgentSeed = worldFor(1, 2)

  assert.equal(baseline.worldSeed, 1)
  assert.equal(baseline.agentSeed, 1)
  assert.deepEqual(baseline.agents.map((agent) => agent.persona), repeated.agents.map((agent) => agent.persona))
  assert.deepEqual(baseline.agents.map((agent) => agent.persona), changedWorldSeed.agents.map((agent) => agent.persona))
  assert.notDeepEqual(baseline.agents.map((agent) => agent.persona), changedAgentSeed.agents.map((agent) => agent.persona))
  assert.deepEqual(baseline.nodes, changedWorldSeed.nodes)
  assert.equal(baseline.log[0].data.world_seed, 1)
  assert.equal(baseline.log[0].data.agent_seed, 1)
})
