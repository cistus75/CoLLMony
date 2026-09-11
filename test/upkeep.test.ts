import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveTick } from '../src/simulation/engine.ts'
import { createWorld } from '../src/simulation/worldFactory.ts'

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

test('upkeep은 배열 순서와 관계없이 Storage ID 오름차순으로 소비한다', () => {
  const world = createWorld()
  world.tick = 23
  world.agents = world.agents.slice(0, 1)
  world.storages[0].resources.Food = 1
  world.storages[0].resources.Water = 1
  world.storages.push({
    id: 'a-storage',
    name: '우선 창고',
    position: { x: 0, y: 0 },
    size: { width: 1, height: 1 },
    resources: { ...structuredClone(world.storages[0].resources) },
  })

  const next = resolveTick(world, [])

  assert.equal(next.storages[0].resources.Food, 1)
  assert.equal(next.storages[0].resources.Water, 1)
  assert.equal(next.storages[1].resources.Food, 0)
  assert.equal(next.storages[1].resources.Water, 0)
})
