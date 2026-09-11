import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveTick } from '../src/simulation/engine.ts'
import { workPositions } from '../src/simulation/spatial.ts'
import { createWorld } from '../src/simulation/worldFactory.ts'

test('두 Agent의 Construction Crew가 Tier 1을 4 Tick에 완성하고 Tier 2를 공개한다', () => {
  let world = createWorld()
  const building = world.buildings.find((item) => item.id === 'workshop')
  const position = { x: 19, y: 15 }
  const positions = workPositions({ ...building, position })
  world.agents[0].position = positions[0]
  world.agents[1].position = positions[1]
  world.storages[0].resources.Wood = building.inputs.Wood
  world.storages[0].resources.Stone = building.inputs.Stone
  const actions = [1, 2].map((agentId) => ({ agentId, type: 'BUILD', buildingId: building.id }))

  world = resolveTick(world, actions.map((action) => ({ ...action, position, storageId: world.camp.id })))
  for (let tick = 1; tick < 4; tick += 1) world = resolveTick(world, actions)

  assert.equal(world.buildings.find((item) => item.id === building.id).status, 'COMPLETE')
  assert.deepEqual(
    world.buildings.filter((item) => item.tier === 2).map((item) => item.status),
    ['REVEALED', 'REVEALED', 'REVEALED'],
  )
})
