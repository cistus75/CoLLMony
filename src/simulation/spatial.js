import { DIRECTIONS, SIMULATION_CONFIG } from '../config/simulation.js'

export const keyOf = ({ x, y }) => `${x},${y}`
export const distance = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
const inside = ({ x, y }) => x >= 0 && x < SIMULATION_CONFIG.width && y >= 0 && y < SIMULATION_CONFIG.height

export function footprintCells(entity) {
  const size = entity.size ?? { width: 1, height: 1 }
  return Array.from({ length: size.width * size.height }, (_, index) => ({
    x: entity.position.x + (index % size.width),
    y: entity.position.y + Math.floor(index / size.width),
  }))
}

export function workPositions(entity, blocked = new Set()) {
  const size = entity.size ?? { width: 1, height: 1 }
  const left = entity.position.x
  const top = entity.position.y
  const right = left + size.width - 1
  const bottom = top + size.height - 1
  return [
    { x: left + Math.floor((size.width - 1) / 2), y: top - 1 },
    { x: right + 1, y: top + Math.floor((size.height - 1) / 2) },
    { x: right - Math.floor((size.width - 1) / 2), y: bottom + 1 },
    { x: left - 1, y: bottom - Math.floor((size.height - 1) / 2) },
  ].filter((position) => inside(position) && !blocked.has(keyOf(position)))
}

export function nearestWorkPosition(agent, entity, blocked = new Set()) {
  return workPositions(entity, blocked).toSorted((a, b) => distance(agent.position, a) - distance(agent.position, b) || keyOf(a).localeCompare(keyOf(b)))[0]
}

export function blockedCells(world) {
  const visibleBuildings = world.buildings.filter((building) => building.status !== 'LOCKED')
  return new Set([
    ...footprintCells(world.camp),
    ...world.nodes.flatMap(footprintCells),
    ...visibleBuildings.flatMap(footprintCells),
  ].map(keyOf))
}

export function createMovePath(from, target, blocked = new Set(), limit = SIMULATION_CONFIG.moveCellsPerTick) {
  if (keyOf(from) === keyOf(target)) return []
  const queue = [from]
  const previous = new Map([[keyOf(from), null]])
  let cursor = 0

  while (cursor < queue.length) {
    const current = queue[cursor]
    cursor += 1
    if (keyOf(current) === keyOf(target)) break
    const nextPoints = DIRECTIONS
      .map((direction) => ({ x: current.x + direction.x, y: current.y + direction.y }))
      .filter((point) => inside(point) && (!blocked.has(keyOf(point)) || keyOf(point) === keyOf(target)))
      .toSorted((a, b) => distance(a, target) - distance(b, target) || keyOf(a).localeCompare(keyOf(b)))
    for (const point of nextPoints) {
      if (previous.has(keyOf(point))) continue
      previous.set(keyOf(point), current)
      queue.push(point)
    }
  }

  if (!previous.has(keyOf(target))) return []
  const path = []
  let point = target
  while (keyOf(point) !== keyOf(from)) {
    path.unshift(point)
    point = previous.get(keyOf(point))
  }
  return path.slice(0, limit)
}
