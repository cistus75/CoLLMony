import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveTick } from '../src/simulation/engine.js'
import { workPositions } from '../src/simulation/spatial.js'
import { createWorld } from '../src/simulation/worldFactory.js'

test('BUILD는 Tick별 참여와 중단을 기록한다', () => {
  const world = createWorld()
  const building = world.buildings.find((item) => item.id === 'workshop')
  const storage = world.storages[0]
  world.agents[0].position = workPositions(building)[0]
  storage.resources.Wood = building.inputs.Wood
  storage.resources.Stone = building.inputs.Stone

  const started = resolveTick(world, [{ agentId: 1, type: 'BUILD', buildingId: building.id }])
  assert.equal(started.agents[0].buildTargetId, building.id)
  assert.equal(started.agents[0].stats.buildTicks, 1)

  const continued = resolveTick(started, [{ agentId: 1, type: 'BUILD', buildingId: building.id }])
  assert.equal(continued.agents[0].stats.buildTicks, 2)

  const abandoned = resolveTick(continued, [{ agentId: 1, type: 'WAIT' }])
  assert.equal(abandoned.agents[0].buildTargetId, null)
  assert.equal(abandoned.agents[0].stats.buildAbandons, 1)
  assert.ok(abandoned.log.some((event) => event.type === 'BUILD_ABANDON'))
})
