import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveTick } from '../src/simulation/engine.js'
import { createWorld } from '../src/simulation/worldFactory.js'

test('daily upkeep은 24번째 Tick에만 모든 Agent에게 적용된다', () => {
  const world = createWorld()
  world.tick = 22
  const beforeBoundary = resolveTick(world, [])
  assert.equal(beforeBoundary.tick, 23)
  assert.equal(beforeBoundary.storages[0].resources.Food, 25)
  assert.equal(beforeBoundary.storages[0].resources.Water, 25)

  const atBoundary = resolveTick(beforeBoundary, [])
  assert.equal(atBoundary.tick, 24)
  assert.equal(atBoundary.storages[0].resources.Food, 20)
  assert.equal(atBoundary.storages[0].resources.Water, 20)
})
