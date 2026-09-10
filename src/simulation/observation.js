import { SIMULATION_CONFIG } from '../config/simulation.js'
import { distance, footprintCells } from './spatial.js'

const distanceTo = (position, entity) => Math.min(...footprintCells(entity).map((cell) => distance(position, cell)))

export function createAgentObservation(world, agentId) {
  const agent = world.agents.find((item) => item.id === agentId)
  if (!agent) return null
  const config = world.run.config.observation
  const visible = (entity) => !config.partialObservation || distanceTo(agent.position, entity) <= config.fovRadius
  const storageSnapshot = (storage) => ({
    id: storage.id,
    name: storage.name,
    resources: structuredClone(storage.resources),
    ...(config.storageTimestamp ? { observedAt: { tick: world.tick, day: Math.floor(world.tick / SIMULATION_CONFIG.ticksPerDay) + 1 } } : {}),
  })

  return {
    tick: world.tick,
    day: Math.floor(world.tick / SIMULATION_CONFIG.ticksPerDay) + 1,
    self: structuredClone(agent),
    agents: world.agents.filter((item) => item.id !== agent.id && visible(item)).map((item) => ({
      id: item.id,
      name: item.name,
      position: structuredClone(item.position),
      action: structuredClone(item.action),
    })),
    nodes: world.nodes.filter(visible).map((node) => structuredClone(node)),
    buildings: world.buildings.filter((building) => building.status !== 'LOCKED' && visible(building)).map((building) => structuredClone(building)),
    storages: world.storages.filter(visible).map(storageSnapshot),
    launch: structuredClone(world.launch),
    features: structuredClone(world.features),
  }
}

export function createObservations(world) {
  return world.agents.map((agent) => createAgentObservation(world, agent.id))
}
