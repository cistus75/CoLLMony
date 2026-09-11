import assert from 'node:assert/strict'
import test from 'node:test'
import { CAMP_CONFIG, DIRECTIONS, SIMULATION_CONFIG } from '../src/config/simulation.ts'
import { createExperimentConfig } from '../src/config/experiment.ts'
import { footprintCells, keyOf } from '../src/simulation/spatial.ts'
import { createWorld } from '../src/simulation/worldFactory.ts'

test('World Seed 자원 배치는 캠프를 고정하고 모든 노드를 접근 가능하게 둔다', () => {
  for (const worldSeed of [0, 1, 2, 999]) {
    const world = createWorld({ experimentConfig: createExperimentConfig({ experiment: { worldSeed } }) })
    const occupied = new Set(world.nodes.map((node) => keyOf(node.position)))
    const campCells = new Set(footprintCells(world.camp).map(keyOf))

    assert.deepEqual(world.camp, CAMP_CONFIG)
    assert.deepEqual(world.camp.position, {
      x: Math.floor((SIMULATION_CONFIG.width - world.camp.size.width) / 2),
      y: Math.floor((SIMULATION_CONFIG.height - world.camp.size.height) / 2),
    })
    assert.equal(occupied.size, world.nodes.length)
    world.nodes.forEach(({ position }) => {
      assert.ok(position.x >= 0 && position.x < SIMULATION_CONFIG.width)
      assert.ok(position.y >= 0 && position.y < SIMULATION_CONFIG.height)
      assert.ok(!campCells.has(keyOf(position)))
      assert.ok(!DIRECTIONS.some(({ x, y }) => campCells.has(keyOf({ x: position.x + x, y: position.y + y }))))
      assert.ok(DIRECTIONS.some(({ x, y }) => {
        const work = { x: position.x + x, y: position.y + y }
        return work.x >= 0 && work.x < SIMULATION_CONFIG.width
          && work.y >= 0 && work.y < SIMULATION_CONFIG.height
          && !occupied.has(keyOf(work))
          && !campCells.has(keyOf(work))
      }))
    })
  }
})
