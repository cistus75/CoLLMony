import { DEFAULT_EXPERIMENT_CONFIG } from '../config/simulation.ts'
import { oracleSmokeController } from './defaultController.ts'
import { createEpisodeRecorder } from './episodeRecorder.ts'
import { stepWorld } from './engine.ts'
import { createWorld } from './worldFactory.ts'

export function runEpisode({
  config = DEFAULT_EXPERIMENT_CONFIG,
  controller = oracleSmokeController,
} = {}) {
  let world = createWorld({ experimentConfig: config })
  const recorder = createEpisodeRecorder(world)

  while (world.status === 'RUNNING') world = stepWorld(world, controller, recorder)

  return { world, record: recorder.result(world) }
}
