export const EXPERIMENT_LIMITS = {
  worldSeed: { min: 0, max: 2147483647 },
  agentSeed: { min: 0, max: 2147483647 },
  agentCount: { min: 1, max: 5 },
  fovRadius: { min: 1, max: 16 },
}

export const PERSONA_MODES = ['random', 'neutral', 'homogeneous', 'diverse']
export const CONFIG_VERSION = 1

const clampInteger = (value, { min, max }) => Math.min(max, Math.max(min, Math.trunc(Number(value) || 0)))
const booleanOrDefault = (value, fallback) => typeof value === 'boolean' ? value : fallback
const personaModeOrDefault = (value) => PERSONA_MODES.includes(value) ? value : DEFAULT_EXPERIMENT_CONFIG.experiment.personaMode

const freezeConfig = (config) => {
  Object.values(config).filter((section) => section && typeof section === 'object').forEach((section) => Object.freeze(section))
  return Object.freeze(config)
}

export const DEFAULT_EXPERIMENT_CONFIG = freezeConfig({
  configVersion: CONFIG_VERSION,
  experiment: { worldSeed: 1, agentSeed: 1, agentCount: 5, personaMode: 'random' },
  memory: { enabled: true },
  communication: { enabled: true },
  reflection: { enabled: false },
  observation: { partialObservation: true, fovRadius: 4, storageTimestamp: true },
})

export function createExperimentConfig(value: any = {}) {
  return freezeConfig({
    configVersion: CONFIG_VERSION,
    experiment: {
      worldSeed: clampInteger(value.experiment?.worldSeed ?? DEFAULT_EXPERIMENT_CONFIG.experiment.worldSeed, EXPERIMENT_LIMITS.worldSeed),
      agentSeed: clampInteger(value.experiment?.agentSeed ?? DEFAULT_EXPERIMENT_CONFIG.experiment.agentSeed, EXPERIMENT_LIMITS.agentSeed),
      agentCount: clampInteger(value.experiment?.agentCount ?? DEFAULT_EXPERIMENT_CONFIG.experiment.agentCount, EXPERIMENT_LIMITS.agentCount),
      personaMode: personaModeOrDefault(value.experiment?.personaMode),
    },
    memory: { enabled: booleanOrDefault(value.memory?.enabled, DEFAULT_EXPERIMENT_CONFIG.memory.enabled) },
    communication: { enabled: booleanOrDefault(value.communication?.enabled, DEFAULT_EXPERIMENT_CONFIG.communication.enabled) },
    reflection: { enabled: booleanOrDefault(value.reflection?.enabled, DEFAULT_EXPERIMENT_CONFIG.reflection.enabled) },
    observation: {
      partialObservation: booleanOrDefault(value.observation?.partialObservation, DEFAULT_EXPERIMENT_CONFIG.observation.partialObservation),
      fovRadius: clampInteger(value.observation?.fovRadius ?? DEFAULT_EXPERIMENT_CONFIG.observation.fovRadius, EXPERIMENT_LIMITS.fovRadius),
      storageTimestamp: booleanOrDefault(value.observation?.storageTimestamp, DEFAULT_EXPERIMENT_CONFIG.observation.storageTimestamp),
    },
  })
}

export function createRunMetadata(runId, config) {
  return {
    run_id: runId,
    config_version: config.configVersion,
    world_seed: config.experiment.worldSeed,
    agent_seed: config.experiment.agentSeed,
    agent_count: config.experiment.agentCount,
    persona_mode: config.experiment.personaMode,
    memory_enabled: config.memory.enabled,
    communication_enabled: config.communication.enabled,
    reflection_enabled: config.reflection.enabled,
    partial_observation: config.observation.partialObservation,
    fov_radius: config.observation.fovRadius,
    storage_timestamp: config.observation.storageTimestamp,
  }
}

export function updateExperimentConfig(config, section, field, value) {
  return createExperimentConfig({
    ...config,
    [section]: { ...config[section], [field]: value },
  })
}
