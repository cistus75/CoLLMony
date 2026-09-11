export const PLAYBACK_SPEEDS = [0.5, 1, 4, 8]

export const TRAIT_LABELS = {
  exploration: '탐색',
  planning: '계획',
  communication: '대화',
  persistence: '지속',
  roleConsistency: '역할',
}

export const EVENT_LABELS = {
  SYSTEM: 'SYSTEM',
  GATHER: 'GATHER',
  DELIVER: 'DELIVER',
  PROCESS: 'PROCESS',
  BUILD: 'BUILD',
  BUILD_SITE: 'BUILD SITE',
  STORAGE: 'STORAGE',
  LAUNCH: 'LAUNCH',
  INVALID: 'INVALID',
  TECH: 'TECH',
  UPKEEP: 'UPKEEP',
  COMPLETE: 'COMPLETE',
  TIME_LIMIT: 'LIMIT',
}

export const RESOURCE_GROUP_LABELS = {
  survival: '생존 자원',
  raw: '원자재',
  processed: '가공재',
  component: '부품',
}

export const PLAYBACK_TIMING = {
  moveStepMs: 120,
  minimumMoveStepMs: 18,
  tickGapMs: 260,
  minimumTickGapMs: 35,
}
