import assert from 'node:assert/strict'
import test from 'node:test'
import { createEpisodeRecorder } from '../src/simulation/episodeRecorder.ts'
import { stepWorld } from '../src/simulation/engine.ts'
import { createWorld } from '../src/simulation/worldFactory.ts'

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
  assert.equal(result.ticks[0].controllerId, 'oracle-smoke-controller')
  assert.ok(result.ticks[0].actions.length > 0)
  assert.ok(result.events.some((event) => event.type === 'SYSTEM'))
  assert.ok(result.events.length >= second.log.length)
  assert.equal(result.outcome.tick, 2)
  assert.ok(!Object.hasOwn(second, 'episodeRecord'))
})
