import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveTick } from '../src/simulation/engine.js'
import { workPositions } from '../src/simulation/spatial.js'
import { createWorld } from '../src/simulation/worldFactory.js'

test('두 Agent의 Construction Crew가 Tier 1을 4 Tick에 완성하고 Tier 2를 공개한다', () => {
  let world = createWorld()
  const building = world.buildings.find((item) => item.id === 'workshop')
  const positions = workPositions(building)
  world.agents[0].position = positions[0]
  world.agents[1].position = positions[1]
  world.storages[0].resources.Wood = building.inputs.Wood
  world.storages[0].resources.Stone = building.inputs.Stone
  const actions = [1, 2].map((agentId) => ({ agentId, type: 'BUILD', buildingId: building.id }))

  for (let tick = 0; tick < 4; tick += 1) world = resolveTick(world, actions)

  assert.equal(world.buildings.find((item) => item.id === building.id).status, 'COMPLETE')
  assert.deepEqual(
    world.buildings.filter((item) => item.tier === 2).map((item) => item.status),
    ['REVEALED', 'REVEALED', 'REVEALED'],
  )
})
