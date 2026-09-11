import { CAMP_CONFIG, DIRECTIONS, RESOURCE_NODE_TYPES, SIMULATION_CONFIG } from '../config/simulation.ts'
import { seededValue } from './determinism.ts'
import { footprintCells, keyOf } from './spatial.ts'

const adjacentKeys = (position) => DIRECTIONS.map(({ x, y }) => keyOf({ x: position.x + x, y: position.y + y }))

export function generateResourceNodes(worldSeed) {
  const campCells = footprintCells(CAMP_CONFIG)
  const excluded = new Set([...campCells.map(keyOf), ...campCells.flatMap(adjacentKeys)])
  const candidates = Array.from({ length: SIMULATION_CONFIG.width * SIMULATION_CONFIG.height }, (_, index) => ({
    x: index % SIMULATION_CONFIG.width,
    y: Math.floor(index / SIMULATION_CONFIG.width),
  })).filter((position) => !excluded.has(keyOf(position)))
  const occupied = new Set()

  return RESOURCE_NODE_TYPES.map((node) => {
    const position = candidates
      .filter((candidate) => !occupied.has(keyOf(candidate)) && adjacentKeys(candidate).every((key) => !occupied.has(key)))
      .toSorted((a, b) => seededValue(worldSeed, node.id, a.x, a.y) - seededValue(worldSeed, node.id, b.x, b.y) || keyOf(a).localeCompare(keyOf(b)))[0]
    occupied.add(keyOf(position))
    return { ...structuredClone(node), position }
  })
}
