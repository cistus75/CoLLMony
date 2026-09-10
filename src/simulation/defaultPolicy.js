import { LAUNCH_CONFIG, SIMULATION_CONFIG } from '../config/simulation.js'

const frontierOf = (world) => world.buildings.filter((building) => building.status === 'REVEALED' || building.status === 'UNDER_CONSTRUCTION')
const storageById = (world, storageId) => world.storages.find((storage) => storage.id === storageId)
const hasInputs = (storage, inputs) => Object.entries(inputs).every(([resource, amount]) => storage.resources[resource] >= amount)
const totalResource = (world, resource) => world.storages.reduce((sum, storage) => sum + storage.resources[resource], 0)

function acquisitionFor(world, resource, storageId, visited = new Set()) {
  const node = world.nodes.find((item) => item.resource === resource)
  if (node) return { type: 'GATHER', nodeId: node.id, storageId }
  if (visited.has(resource)) return null
  visited.add(resource)
  const recipe = world.recipes.find((item) => item.output.resource === resource)
  const unlocked = recipe && world.buildings.some((building) => building.id === recipe.requires && building.status === 'COMPLETE')
  if (!unlocked) return null
  const storage = storageById(world, storageId)
  const missingInput = Object.entries(recipe.inputs).find(([input, amount]) => storage.resources[input] < amount)
  return missingInput ? acquisitionFor(world, missingInput[0], storageId, visited) : { type: 'PROCESS', recipeId: recipe.id, storageId }
}

function chooseWork(world, agent, frontier) {
  const campStorage = storageById(world, world.camp.id)
  if (totalResource(world, 'Food') < SIMULATION_CONFIG.survivalThreshold) return acquisitionFor(world, 'Food', campStorage.id)
  if (totalResource(world, 'Water') < SIMULATION_CONFIG.survivalThreshold) return acquisitionFor(world, 'Water', campStorage.id)

  const target = frontier[0]
  if (target) {
    const storage = storageById(world, target.storageId)
    const needs = Object.entries(target.inputs).filter(([resource, amount]) => storage.resources[resource] < amount)
    for (let index = 0; index < needs.length; index += 1) {
      const resource = needs[(index + agent.id - 1) % needs.length][0]
      const work = acquisitionFor(world, resource, storage.id)
      if (work) return work
    }
  }

  if (world.launch.status === 'READY') {
    const storage = storageById(world, world.launch.storageId)
    const { resource, amount } = LAUNCH_CONFIG.fuel
    if (storage.resources[resource] < amount) return acquisitionFor(world, resource, storage.id)
    return { type: 'LAUNCH' }
  }

  return target ? null : acquisitionFor(world, agent.id % 2 ? 'Wood' : 'Stone', campStorage.id)
}

function actionForAgent(world, agent, frontier, buildable) {
  if (world.launch.status === 'IN_PROGRESS') return { type: 'WAIT' }
  if (agent.process || agent.gather) return { type: 'CONTINUE' }
  if (agent.cargo.amount > 0) {
    if (agent.cargo.amount < SIMULATION_CONFIG.cargoBatchSize) {
      const node = world.nodes.find((item) => item.resource === agent.cargo.type)
      return { type: 'GATHER', nodeId: node.id, storageId: agent.cargo.storageId }
    }
    return { type: 'DELIVER', storageId: agent.cargo.storageId }
  }
  if (buildable) return { type: 'BUILD', buildingId: buildable.id }
  return chooseWork(world, agent, frontier) ?? { type: 'WAIT' }
}

export function selectDefaultActions(world) {
  const frontier = frontierOf(world)
  const buildable = frontier.find((building) => building.status === 'UNDER_CONSTRUCTION' || hasInputs(storageById(world, building.storageId), building.inputs))
  return world.agents.map((agent) => ({ agentId: agent.id, ...actionForAgent(world, agent, frontier, buildable) }))
}
