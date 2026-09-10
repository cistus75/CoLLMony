import {
  ACTION_CONFIG,
  AGENT_CONFIG,
  BUILDING_BLUEPRINTS,
  CAMP_CONFIG,
  createExperimentConfig,
  DEFAULT_EXPERIMENT_CONFIG,
  FEATURE_CONFIG,
  PROCESS_RECIPES,
  RESOURCE_CONFIG,
  RESOURCE_NODES,
  STORAGE_CONFIG,
  UPKEEP_CONFIG,
} from '../config/simulation.js'
import { validateSimulationConfig } from './validateConfig.js'

function seededValue(seed, ...parts) {
  let value = seed >>> 0
  for (const part of parts.join(':')) value = Math.imul(value ^ part.charCodeAt(0), 2654435761) >>> 0
  return value
}

function makeTraits(seed, index, mode) {
  if (mode === 'neutral') return Object.fromEntries(AGENT_CONFIG.traits.map((trait) => [trait, 5]))
  if (mode === 'homogeneous') {
    const score = 3 + (seededValue(seed, 'shared') % 6)
    return Object.fromEntries(AGENT_CONFIG.traits.map((trait) => [trait, score]))
  }
  if (mode === 'diverse') {
    return Object.fromEntries(AGENT_CONFIG.traits.map((trait, traitIndex) => [trait, 1 + ((index * 2 + traitIndex * 3 + seed) % 10)]))
  }
  return Object.fromEntries(AGENT_CONFIG.traits.map((trait) => [trait, 1 + (seededValue(seed, index, trait) % 10)]))
}

function emptyResources() {
  return Object.fromEntries(Object.keys(RESOURCE_CONFIG).map((resource) => [resource, 0]))
}

export function createWorld({
  experimentConfig = DEFAULT_EXPERIMENT_CONFIG,
  personaMode = 'random',
} = {}) {
  validateSimulationConfig()
  const runConfig = createExperimentConfig(experimentConfig)
  const seed = runConfig.experiment.seed
  const runId = globalThis.crypto.randomUUID()

  return {
    worldSeed: seed,
    agentSeed: seed,
    personaMode,
    run: { id: runId, config: runConfig },
    tick: 0,
    status: 'RUNNING',
    camp: structuredClone(CAMP_CONFIG),
    storages: [{
      ...structuredClone(CAMP_CONFIG),
      resources: { ...emptyResources(), ...STORAGE_CONFIG.initialResources },
    }],
    nodes: structuredClone(RESOURCE_NODES),
    buildings: BUILDING_BLUEPRINTS.map((building) => ({
      ...structuredClone(building),
      status: building.tier === 1 ? 'REVEALED' : 'LOCKED',
      storageId: building.tier === 1 ? CAMP_CONFIG.id : null,
      duration: ACTION_CONFIG.BUILD[building.tier],
      workRemaining: ACTION_CONFIG.BUILD[building.tier],
    })),
    agents: AGENT_CONFIG.names.slice(0, runConfig.experiment.agentCount).map((name, index) => ({
      id: index + 1,
      name,
      position: { ...AGENT_CONFIG.startPositions[index] },
      movePath: [],
      action: { type: 'WAIT', detail: '다음 결정을 기다리는 중' },
      cargo: { type: null, amount: 0, storageId: null },
      needs: Object.fromEntries(Object.keys(UPKEEP_CONFIG.perAgent).map((resource) => [resource.toLowerCase(), 0])),
      persona: makeTraits(seed, index, personaMode),
      gather: null,
      process: null,
      pendingDelivery: false,
      stats: { moves: 0, gathered: 0, delivered: 0, built: 0 },
    })),
    recipes: structuredClone(PROCESS_RECIPES),
    features: {
      ...structuredClone(FEATURE_CONFIG),
      memory: runConfig.memory.enabled,
      communication: runConfig.communication.enabled,
      reflection: runConfig.reflection.enabled,
    },
    launch: { status: 'LOCKED', actorId: null, storageId: null, remaining: 0 },
    log: [{
      id: 'start-0',
      tick: 0,
      type: 'SYSTEM',
      message: 'Episode가 시작되었습니다.',
      data: { runId, config: structuredClone(runConfig) },
    }],
    nextEventId: 1,
  }
}
