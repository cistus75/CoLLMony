import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveTick } from '../src/simulation/engine.ts'
import { workPositions } from '../src/simulation/spatial.ts'
import { createWorld } from '../src/simulation/worldFactory.ts'

test('PROCESS는 시작 시 입력을 소비하고 완료 시 같은 Storage에 출력한다', () => {
  const world = createWorld()
  const recipe = world.recipes.find((item) => item.id === 'plank')
  const building = world.buildings.find((item) => item.id === recipe.requires)
  const storage = world.storages[0]
  building.position = { x: 19, y: 15 }
  building.status = 'COMPLETE'
  world.agents[0].position = workPositions(building)[0]
  storage.resources.Wood = 2

  const started = resolveTick(world, [{ agentId: 1, type: 'PROCESS', recipeId: recipe.id, storageId: storage.id }])
  assert.equal(started.storages[0].resources.Wood, 0)
  assert.equal(started.storages[0].resources.Plank, 0)

  const completed = resolveTick(started, [{ agentId: 1, type: 'CONTINUE' }])
  assert.equal(completed.agents[0].process, null)
  assert.equal(completed.storages[0].resources.Plank, 1)
})
