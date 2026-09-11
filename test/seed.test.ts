import assert from 'node:assert/strict'
import test from 'node:test'
import { createExperimentConfig } from '../src/config/experiment.ts'
import { createWorld } from '../src/simulation/worldFactory.ts'

const worldFor = (worldSeed, agentSeed, personaMode = 'random') => createWorld({
  experimentConfig: createExperimentConfig({ experiment: { worldSeed, agentSeed, personaMode } }),
})

test('World Seed와 Agent Seed를 독립적으로 재현한다', () => {
  const baseline = worldFor(1, 1)
  const repeated = worldFor(1, 1)
  const changedWorldSeed = worldFor(2, 1)
  const changedAgentSeed = worldFor(1, 2)
  const changedPersonaMode = worldFor(1, 1, 'neutral')

  assert.equal(baseline.run.config.experiment.worldSeed, 1)
  assert.equal(baseline.run.config.experiment.agentSeed, 1)
  assert.equal(baseline.run.config.configVersion, 1)
  assert.deepEqual(baseline.agents.map((agent) => agent.persona), repeated.agents.map((agent) => agent.persona))
  assert.deepEqual(baseline.agents.map((agent) => agent.persona), changedWorldSeed.agents.map((agent) => agent.persona))
  assert.notDeepEqual(baseline.agents.map((agent) => agent.persona), changedAgentSeed.agents.map((agent) => agent.persona))
  assert.notDeepEqual(baseline.agents.map((agent) => agent.persona), changedPersonaMode.agents.map((agent) => agent.persona))
  assert.deepEqual(baseline.nodes, repeated.nodes)
  assert.deepEqual(baseline.nodes, changedAgentSeed.nodes)
  assert.notDeepEqual(baseline.nodes, changedWorldSeed.nodes)
  assert.equal(baseline.log[0].data.world_seed, 1)
  assert.equal(baseline.log[0].data.agent_seed, 1)
  assert.equal(baseline.log[0].data.config_version, 1)
  assert.equal(baseline.log[0].data.persona_mode, 'random')
  assert.ok(!Object.hasOwn(baseline, 'personaMode'))
})
