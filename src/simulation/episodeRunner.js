import { DEFAULT_EXPERIMENT_CONFIG } from '../config/simulation.js'
import { defaultController } from './defaultController.js'
import { createEpisodeRecorder } from './episodeRecorder.js'
import { stepWorld } from './engine.js'
import { createWorld } from './worldFactory.js'

export function runEpisode({
  config = DEFAULT_EXPERIMENT_CONFIG,
  controller = defaultController,
  personaMode = 'random',
} = {}) {
  let world = createWorld({ experimentConfig: config, personaMode })
  const recorder = createEpisodeRecorder(world)

  while (world.status === 'RUNNING') world = stepWorld(world, controller, recorder)

  return { world, record: recorder.result(world) }
}
