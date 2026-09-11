import assert from 'node:assert/strict'
import test from 'node:test'
import { createEpisodeRecorder } from '../src/simulation/episodeRecorder.js'
import { stepWorld } from '../src/simulation/engine.js'
import { createWorld } from '../src/simulation/worldFactory.js'

test('EpisodeRecorder는 UI World 밖에 전체 Tick 기록을 보관한다', () => {
  const initial = createWorld()
  const recorder = createEpisodeRecorder(initial)
  const first = stepWorld(initial, undefined, recorder)
  const second = stepWorld(first, undefined, recorder)
  const result = recorder.result(second)

  assert.equal(result.run.id, initial.run.id)
  assert.deepEqual(result.run.config, initial.run.config)
  assert.equal(result.ticks.length, 2)
  assert.equal(result.ticks[0].tick, 1)
  assert.equal(result.ticks[0].controllerId, 'default-policy')
  assert.ok(result.ticks[0].actions.length > 0)
  assert.equal(result.outcome.tick, 2)
  assert.ok(!Object.hasOwn(second, 'episodeRecord'))
})
