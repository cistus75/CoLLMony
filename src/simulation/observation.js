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
  const physicalObservation = {
    agents: world.agents.filter((item) => item.id !== agent.id && visible(item)).map((item) => ({
      id: item.id,
      name: item.name,
      position: structuredClone(item.position),
      action: structuredClone(item.action),
    })),
    nodes: world.nodes.filter(visible).map((node) => structuredClone(node)),
    buildings: world.buildings.filter((building) => building.status !== 'LOCKED' && visible(building)).map((building) => structuredClone(building)),
    storages: world.storages.filter(visible).map(storageSnapshot),
  }
  const sharedTechKnowledge = {
    frontier: world.buildings
      .filter((building) => building.status === 'REVEALED' || building.status === 'UNDER_CONSTRUCTION')
      .map(({ id, name, tier, status, inputs }) => ({ id, name, tier, status, inputs: structuredClone(inputs) })),
  }
  const self = {
    id: agent.id,
    name: agent.name,
    position: structuredClone(agent.position),
    action: structuredClone(agent.action),
    cargo: structuredClone(agent.cargo),
    needs: structuredClone(agent.needs),
    persona: structuredClone(agent.persona),
  }

  return {
    tick: world.tick,
    day: Math.floor(world.tick / SIMULATION_CONFIG.ticksPerDay) + 1,
    self,
    physicalObservation,
    sharedTechKnowledge,
    launch: structuredClone(world.launch),
    features: {
      ...structuredClone(world.features),
      memory: world.run.config.memory.enabled,
      communication: world.run.config.communication.enabled,
      reflection: world.run.config.reflection.enabled,
    },
  }
}

export function createObservations(world, agentIds = world.agents.map((agent) => agent.id)) {
  return agentIds.map((agentId) => createAgentObservation(world, agentId)).filter(Boolean)
}
