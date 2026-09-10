import {
  AGENT_CONFIG,
  BUILDING_BLUEPRINTS,
  CAMP_CONFIG,
  RESOURCE_CONFIG,
  RESOURCE_NODES,
  SIMULATION_CONFIG,
} from '../config/simulation.js'

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
  worldSeed = SIMULATION_CONFIG.defaultWorldSeed,
  agentSeed = SIMULATION_CONFIG.defaultAgentSeed,
  personaMode = 'random',
} = {}) {
  const storage = {
    ...emptyResources(),
    Food: SIMULATION_CONFIG.startingNeeds,
    Water: SIMULATION_CONFIG.startingNeeds,
  }

  return {
    worldSeed,
    agentSeed,
    personaMode,
    tick: 0,
    status: 'RUNNING',
    camp: structuredClone(CAMP_CONFIG),
    storage,
    nodes: structuredClone(RESOURCE_NODES),
    buildings: BUILDING_BLUEPRINTS.map((building) => ({
      ...structuredClone(building),
      status: building.tier === 1 ? 'REVEALED' : 'LOCKED',
      workRemaining: building.duration,
    })),
    agents: AGENT_CONFIG.names.map((name, index) => ({
      id: index + 1,
      name,
      position: { ...AGENT_CONFIG.startPositions[index] },
      movePath: [],
      action: { type: 'WAIT', detail: '다음 결정을 기다리는 중' },
      cargo: { type: null, amount: 0 },
      needs: { food: 0, water: 0 },
      persona: makeTraits(agentSeed, index, personaMode),
      gather: null,
      pendingDelivery: false,
      stats: { moves: 0, gathered: 0, delivered: 0, built: 0 },
    })),
    log: [{ id: 'start-0', tick: 0, type: 'SYSTEM', message: 'Episode가 시작되었습니다.' }],
    nextEventId: 1,
  }
}
