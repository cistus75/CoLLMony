import assert from 'node:assert/strict'
import test from 'node:test'
import { createExperimentConfig } from '../src/config/experiment.js'
import { runEpisode } from '../src/simulation/episodeRunner.js'

test('headless runner는 React 없이 같은 World Tick을 종료 상태까지 실행한다', () => {
  const controller = {
    id: 'wait-only',
    decide(observations) {
      return observations.map(({ self }) => ({ agentId: self.id, type: 'WAIT' }))
    },
  }
  const { world, record } = runEpisode({
    config: createExperimentConfig({ experiment: { agentCount: 1 } }),
    controller,
  })

  assert.equal(world.status, 'TIME_LIMIT')
  assert.equal(world.tick, 2400)
  assert.equal(record.ticks.length, world.tick)
  assert.equal(record.outcome.status, world.status)
})
