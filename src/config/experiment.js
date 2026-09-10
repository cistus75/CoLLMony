export const EXPERIMENT_LIMITS = {
  seed: { min: 0, max: 2147483647 },
  agentCount: { min: 1, max: 5 },
  fovRadius: { min: 1, max: 16 },
}

const clampInteger = (value, { min, max }) => Math.min(max, Math.max(min, Math.trunc(Number(value) || 0)))

const freezeConfig = (config) => {
  Object.values(config).forEach((section) => Object.freeze(section))
  return Object.freeze(config)
}

export const DEFAULT_EXPERIMENT_CONFIG = freezeConfig({
  experiment: { seed: 1, agentCount: 5 },
  memory: { enabled: true },
  communication: { enabled: true },
  reflection: { enabled: false },
  observation: { partialObservation: true, fovRadius: 4, storageTimestamp: true },
})

export function createExperimentConfig(value = {}) {
  return freezeConfig({
    experiment: {
      seed: clampInteger(value.experiment?.seed ?? DEFAULT_EXPERIMENT_CONFIG.experiment.seed, EXPERIMENT_LIMITS.seed),
      agentCount: clampInteger(value.experiment?.agentCount ?? DEFAULT_EXPERIMENT_CONFIG.experiment.agentCount, EXPERIMENT_LIMITS.agentCount),
    },
    memory: { enabled: value.memory?.enabled ?? DEFAULT_EXPERIMENT_CONFIG.memory.enabled },
    communication: { enabled: value.communication?.enabled ?? DEFAULT_EXPERIMENT_CONFIG.communication.enabled },
    reflection: { enabled: value.reflection?.enabled ?? DEFAULT_EXPERIMENT_CONFIG.reflection.enabled },
    observation: {
      partialObservation: value.observation?.partialObservation ?? DEFAULT_EXPERIMENT_CONFIG.observation.partialObservation,
      fovRadius: clampInteger(value.observation?.fovRadius ?? DEFAULT_EXPERIMENT_CONFIG.observation.fovRadius, EXPERIMENT_LIMITS.fovRadius),
      storageTimestamp: value.observation?.storageTimestamp ?? DEFAULT_EXPERIMENT_CONFIG.observation.storageTimestamp,
    },
  })
}

export function updateExperimentConfig(config, section, field, value) {
  return createExperimentConfig({
    ...config,
    [section]: { ...config[section], [field]: value },
  })
}
