export const SIMULATION_CONFIG = {
  width: 32,
  height: 32,
  ticksPerDay: 24,
  maxTicks: 2400,
  moveCellsPerTick: 4,
  observationRange: 4,
  defaultWorldSeed: 427,
  defaultAgentSeed: 1000,
  cargoBatchSize: 3,
  startingNeeds: 25,
  survivalThreshold: 10,
  maxLogEntries: 80,
}

export const RESOURCE_CONFIG = {
  Food: { label: '식량', code: 'FO', kind: 'ordinary' },
  Water: { label: '물', code: 'WA', kind: 'ordinary' },
  Wood: { label: '목재', code: 'WO', kind: 'ordinary' },
  Stone: { label: '석재', code: 'ST', kind: 'mineral' },
  Coal: { label: '석탄', code: 'CO', kind: 'mineral' },
  Iron: { label: '철', code: 'IR', kind: 'mineral' },
  Fiber: { label: '섬유', code: 'FI', kind: 'ordinary' },
}

export const DIRECTIONS = [
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 0, y: -1 },
]

export const RESOURCE_NODES = [
  { id: 'food', resource: 'Food', position: { x: 5, y: 6 } },
  { id: 'water', resource: 'Water', position: { x: 26, y: 5 } },
  { id: 'wood', resource: 'Wood', position: { x: 5, y: 24 } },
  { id: 'stone', resource: 'Stone', position: { x: 27, y: 25 } },
  { id: 'coal', resource: 'Coal', position: { x: 28, y: 15 } },
  { id: 'iron', resource: 'Iron', position: { x: 25, y: 20 } },
  { id: 'fiber', resource: 'Fiber', position: { x: 7, y: 14 } },
]

export const BUILDING_BLUEPRINTS = [
  { id: 'workshop', name: '작업장', tier: 1, position: { x: 19, y: 15 }, size: { width: 2, height: 2 }, inputs: { Wood: 10, Stone: 4 }, duration: 8 },
  { id: 'kiln', name: '가마', tier: 2, position: { x: 20, y: 11 }, size: { width: 2, height: 2 }, inputs: { Wood: 8, Stone: 6 }, duration: 16 },
  { id: 'quarry', name: '채석장', tier: 2, position: { x: 20, y: 20 }, size: { width: 2, height: 2 }, inputs: { Wood: 10, Stone: 10 }, duration: 16 },
  { id: 'warehouse', name: '창고', tier: 2, position: { x: 11, y: 15 }, size: { width: 2, height: 2 }, inputs: { Wood: 12, Stone: 10 }, duration: 16 },
  { id: 'forge', name: '대장간', tier: 3, position: { x: 23, y: 13 }, size: { width: 2, height: 2 }, inputs: { Wood: 10, Stone: 10 }, duration: 32 },
  { id: 'loom', name: '직조 공방', tier: 3, position: { x: 23, y: 18 }, size: { width: 2, height: 2 }, inputs: { Wood: 10, Stone: 10 }, duration: 32 },
  { id: 'farm', name: '공동 농장', tier: 3, position: { x: 11, y: 9 }, size: { width: 2, height: 2 }, inputs: { Wood: 10, Stone: 10 }, duration: 32 },
  { id: 'water-tower', name: '물 저장탑', tier: 3, position: { x: 12, y: 22 }, size: { width: 2, height: 2 }, inputs: { Wood: 10, Stone: 10 }, duration: 32 },
  { id: 'precision-shop', name: '정밀 작업장', tier: 3, position: { x: 8, y: 18 }, size: { width: 2, height: 2 }, inputs: { Wood: 10, Stone: 10 }, duration: 32 },
  { id: 'solar-array', name: '태양광 배열', tier: 4, position: { x: 25, y: 8 }, size: { width: 2, height: 2 }, inputs: { Wood: 15, Stone: 15 }, duration: 64 },
  { id: 'habitat', name: '생활관', tier: 4, position: { x: 24, y: 27 }, size: { width: 2, height: 2 }, inputs: { Wood: 15, Stone: 15 }, duration: 64 },
  { id: 'research-lab', name: '연구소', tier: 4, position: { x: 8, y: 7 }, size: { width: 2, height: 2 }, inputs: { Wood: 15, Stone: 15 }, duration: 64 },
  { id: 'machine-shop', name: '기계 공방', tier: 4, position: { x: 7, y: 26 }, size: { width: 2, height: 2 }, inputs: { Wood: 15, Stone: 15 }, duration: 64 },
  { id: 'fuel-depot', name: '연료 저장소', tier: 4, position: { x: 24, y: 15 }, size: { width: 2, height: 2 }, inputs: { Wood: 15, Stone: 15 }, duration: 64 },
  { id: 'observatory', name: '관측소', tier: 4, position: { x: 15, y: 6 }, size: { width: 2, height: 2 }, inputs: { Wood: 15, Stone: 15 }, duration: 64 },
  { id: 'assembly-hall', name: '조립 격납고', tier: 4, position: { x: 15, y: 25 }, size: { width: 2, height: 2 }, inputs: { Wood: 15, Stone: 15 }, duration: 64 },
  { id: 'spaceport', name: 'Spaceport', tier: 5, position: { x: 19, y: 25 }, size: { width: 3, height: 3 }, inputs: { Wood: 20, Stone: 20 }, duration: 128 },
]

export const CAMP_CONFIG = {
  id: 'camp',
  name: 'Camp',
  position: { x: 15, y: 15 },
  size: { width: 2, height: 2 },
}

export const AGENT_CONFIG = {
  names: ['A', 'B', 'C', 'D', 'E'],
  traits: ['exploration', 'planning', 'communication', 'persistence', 'roleConsistency'],
  startPositions: [
    { x: 14, y: 15 },
    { x: 15, y: 14 },
    { x: 17, y: 15 },
    { x: 15, y: 17 },
    { x: 17, y: 16 },
  ],
}
