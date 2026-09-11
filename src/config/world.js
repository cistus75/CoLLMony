export const SIMULATION_CONFIG = {
  width: 32,
  height: 32,
  ticksPerDay: 24,
  maxTicks: 2400,
  moveCellsPerTick: 4,
  cargoBatchSize: 3,
  survivalThreshold: 10,
  maxLogEntries: 80,
}

export const ACTION_CONFIG = {
  MOVE: 1,
  PROCESS: 2,
  BUILD: { 1: 8, 2: 16, 3: 32, 4: 64, 5: 128 },
  TALK: 1,
  WAIT: 1,
  LAUNCH: 1,
}

export const TECH_CONFIG = {
  buildingCounts: { 1: 1, 2: 3, 3: 5, 4: 7, 5: 2 },
}

export const DIRECTIONS = [
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 0, y: -1 },
]

export const CAMP_CONFIG = {
  id: 'camp',
  name: '캠프',
  position: { x: 15, y: 15 },
  size: { width: 2, height: 2 },
}

export const STORAGE_CONFIG = {
  initialResources: { Food: 25, Water: 25 },
}

export const UPKEEP_CONFIG = {
  interval: 24,
  perAgent: { Food: 1, Water: 1 },
}

export const LAUNCH_CONFIG = {
  buildingId: 'spaceport',
  spacecraftId: 'rocket',
  fuel: { resource: 'RocketFuel', amount: 30 },
}

export const FEATURE_CONFIG = {
  persona: true,
}
