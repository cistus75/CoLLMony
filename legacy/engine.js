(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CoLLMonyEngine = factory();
})(typeof self !== 'undefined' ? self : globalThis, function () {
  const CONFIG = Object.freeze({
    version: '0.3.0',
    ticksPerDay: 24,
    maxTicks: 2400,
    worldSize: { width: 32, height: 32 },
    observationRange: 4,
    messageBudget: 280,
    traits: {
      exploration: '탐험',
      planning: '계획',
      communication: '대화',
      persistence: '유지',
      roleConsistency: '반복',
    },
    durations: { MOVE: 1, GATHER: 2, MINERAL_GATHER: 4, TALK: 1, WAIT: 1, PROCESS: 2, LAUNCH: 1 },
    buildDurations: { 1: 8, 2: 16, 3: 32, 4: 64, 5: 128 },
    resources: {
      Food: { kind: 'survival', label: 'Food' }, Water: { kind: 'survival', label: 'Water' }, Wood: { kind: 'raw', label: 'Wood' },
      Stone: { kind: 'mineral', label: 'Stone' }, Coal: { kind: 'mineral', label: 'Coal' }, Iron: { kind: 'mineral', label: 'Iron' },
      Fiber: { kind: 'raw', label: 'Fiber' }, Coke: { kind: 'processed', label: 'Coke' }, Steel: { kind: 'processed', label: 'Steel' },
      Textile: { kind: 'processed', label: 'Textile' }, Glass: { kind: 'processed', label: 'Glass' }, RocketFuel: { kind: 'processed', label: 'Rocket Fuel' },
    },
    recipes: [
      { id: 'coke', name: 'Coke', requires: 'kiln', inputs: { Coal: 2 }, output: { resource: 'Coke', amount: 1 } },
      { id: 'glass', name: 'Glass', requires: 'kiln', inputs: { Stone: 2 }, output: { resource: 'Glass', amount: 1 } },
      { id: 'steel', name: 'Steel', requires: 'forge', inputs: { Iron: 2, Coke: 1 }, output: { resource: 'Steel', amount: 1 } },
      { id: 'textile', name: 'Textile', requires: 'loom', inputs: { Fiber: 2 }, output: { resource: 'Textile', amount: 1 } },
      { id: 'rocket-fuel', name: 'Rocket Fuel', requires: 'fuel_depot', inputs: { Coke: 2, Steel: 1 }, output: { resource: 'RocketFuel', amount: 1 } },
    ],
    techTiers: [
      [{ id: 'workshop', name: '작은 작업장', tier: 1, position: { x: 19, y: 16 }, inputs: { Wood: 10, Stone: 4 } }],
      [
        { id: 'kiln', name: '가마', tier: 2, position: { x: 20, y: 12 }, inputs: { Wood: 8, Stone: 6 } },
        { id: 'quarry', name: '채석장', tier: 2, position: { x: 20, y: 20 }, inputs: { Wood: 10, Stone: 10 } },
        { id: 'warehouse', name: '창고', tier: 2, position: { x: 12, y: 16 }, inputs: { Wood: 12, Stone: 10 } },
      ],
      [
        { id: 'forge', name: '대장간', tier: 3, position: { x: 22, y: 15 }, inputs: { Wood: 10, Stone: 10 } },
        { id: 'loom', name: '직조 공방', tier: 3, position: { x: 22, y: 18 }, inputs: { Wood: 10, Stone: 10 } },
        { id: 'farm', name: '공동 농장', tier: 3, position: { x: 12, y: 10 }, inputs: { Wood: 10, Stone: 10 } },
        { id: 'water_tower', name: '물 저장탑', tier: 3, position: { x: 13, y: 23 }, inputs: { Wood: 10, Stone: 10 } },
        { id: 'workshop_2', name: '정밀 작업장', tier: 3, position: { x: 9, y: 18 }, inputs: { Wood: 10, Stone: 10 } },
      ],
      [
        { id: 'solar_array', name: '태양광 배열', tier: 4, position: { x: 25, y: 9 }, inputs: { Wood: 15, Stone: 15 } },
        { id: 'habitat', name: '생활관', tier: 4, position: { x: 25, y: 25 }, inputs: { Wood: 15, Stone: 15 } },
        { id: 'research_lab', name: '연구소', tier: 4, position: { x: 8, y: 8 }, inputs: { Wood: 15, Stone: 15 } },
        { id: 'machine_shop', name: '기계 공방', tier: 4, position: { x: 7, y: 24 }, inputs: { Wood: 15, Stone: 15 } },
        { id: 'fuel_depot', name: '연료 저장소', tier: 4, position: { x: 24, y: 16 }, inputs: { Wood: 15, Stone: 15 } },
        { id: 'observatory', name: '관측소', tier: 4, position: { x: 15, y: 7 }, inputs: { Wood: 15, Stone: 15 } },
        { id: 'assembly_hall', name: '조립 격납고', tier: 4, position: { x: 16, y: 25 }, inputs: { Wood: 15, Stone: 15 } },
      ],
      [{ id: 'spaceport', name: 'Spaceport', tier: 5, position: { x: 20, y: 25 }, inputs: { Wood: 20, Stone: 20 } }],
    ],
    resourceNodes: [
      { id: 'food-node', resource: 'Food', kind: 'ordinary', position: { x: 6, y: 7 } },
      { id: 'water-node', resource: 'Water', kind: 'ordinary', position: { x: 25, y: 6 } },
      { id: 'wood-node', resource: 'Wood', kind: 'ordinary', position: { x: 5, y: 23 } },
      { id: 'stone-node', resource: 'Stone', kind: 'mineral', position: { x: 26, y: 24 } },
      { id: 'coal-node', resource: 'Coal', kind: 'mineral', position: { x: 28, y: 16 } },
      { id: 'iron-node', resource: 'Iron', kind: 'mineral', position: { x: 26, y: 20 } },
      { id: 'fiber-node', resource: 'Fiber', kind: 'ordinary', position: { x: 7, y: 15 } },
    ],
  });

  const AGENT_NAMES = ['A', 'B', 'C', 'D', 'E'];
  const TRAIT_NAMES = Object.keys(CONFIG.traits);
  const START_POSITIONS = [{ x: 15, y: 15 }, { x: 16, y: 15 }, { x: 17, y: 15 }, { x: 15, y: 16 }, { x: 17, y: 16 }];
  const DIRECTIONS = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }];
  const RESOURCE_NAMES = ['Food', 'Water', 'Wood', 'Stone', 'Coal'];

  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function emptyResources() { return Object.fromEntries(Object.keys(CONFIG.resources).map((resource) => [resource, 0])); }
  function hash(seed, ...parts) {
    let value = Number(seed) >>> 0;
    for (const part of parts) {
      const text = String(part);
      for (let index = 0; index < text.length; index += 1) value = Math.imul(value ^ text.charCodeAt(index), 16777619) >>> 0;
    }
    return value >>> 0;
  }
  function randomTraits(agentSeed, agentId) {
    return Object.fromEntries(TRAIT_NAMES.map((trait) => [trait, 1 + hash(agentSeed, agentId, trait) % 10]));
  }
  function shuffled(values, seed, label) {
    return values.slice().sort((a, b) => hash(seed, label, a) - hash(seed, label, b));
  }
  function generatePersonas(agentSeed, mode = 'random') {
    if (mode === 'neutral') return AGENT_NAMES.map((name, index) => ({ id: index + 1, name, traits: Object.fromEntries(TRAIT_NAMES.map((trait) => [trait, 5])) }));
    if (mode === 'homogeneous') {
      const traits = randomTraits(agentSeed, 0);
      return AGENT_NAMES.map((name, index) => ({ id: index + 1, name, traits: copy(traits) }));
    }
    if (mode === 'diverse') {
      const personas = AGENT_NAMES.map((name, index) => ({ id: index + 1, name, traits: {} }));
      TRAIT_NAMES.forEach((trait) => shuffled([2, 4, 6, 8, 10], agentSeed, trait).forEach((score, index) => { personas[index].traits[trait] = score; }));
      return personas;
    }
    return AGENT_NAMES.map((name, index) => ({ id: index + 1, name, traits: randomTraits(agentSeed, index + 1) }));
  }
  function stableOrder(world, values, label) {
    return values.slice().sort((a, b) => hash(world.worldSeed, world.tick, label, a.id) - hash(world.worldSeed, world.tick, label, b.id));
  }
  function pointKey(point) { return `${point.x},${point.y}`; }
  function distance(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }
  function cardinallyAdjacent(a, b) { return distance(a, b) === 1; }
  function inside(point) { return point.x >= 0 && point.x < CONFIG.worldSize.width && point.y >= 0 && point.y < CONFIG.worldSize.height; }
  function getAgent(world, id) { return world.agents.find((agent) => agent.id === Number(id)); }
  function getStorage(world, id) { return world.storages.find((storage) => storage.id === Number(id)); }
  function getNode(world, id) { return world.nodes.find((node) => node.id === id); }
  function getBlueprint(world, id) { return world.blueprints.find((blueprint) => blueprint.id === id); }
  function campStorage(world) { return world.storages.find((storage) => storage.id === 0); }
  function actionMultiplier(agent) { return 1 + Math.max(0, -agent.needs.food, -agent.needs.water); }
  function trait(agent, name) { return agent.persona && agent.persona.traits ? agent.persona.traits[name] : 5; }
  function nodeAt(world, position) { return world.nodes.find((node) => pointKey(node.position) === pointKey(position)); }
  function buildingAt(world, position) { return world.buildings.find((building) => pointKey(building.position) === pointKey(position)); }
  function storageAt(world, position) { return world.storages.find((storage) => pointKey(storage.position) === pointKey(position)); }
  function workPositions(target) { return DIRECTIONS.map((direction) => ({ x: target.x + direction.x, y: target.y + direction.y })); }
  function event(world, type, message, data) { world.log.push({ tick: world.tick, type, message, data: data || null }); if (world.log.length > 500) world.log.shift(); }

  function createWorld(options = {}) {
    const worldSeed = Number.isInteger(options.worldSeed) ? options.worldSeed : 427;
    const agentSeed = Number.isInteger(options.agentSeed) ? options.agentSeed : 1000;
    const personaMode = ['neutral', 'random', 'homogeneous', 'diverse'].includes(options.personaMode) ? options.personaMode : 'random';
    const blueprints = CONFIG.techTiers.flat();
    const personas = generatePersonas(agentSeed, personaMode);
    const agents = personas.map((persona, index) => ({
      id: persona.id,
      name: persona.name,
      persona: { mode: personaMode, traits: copy(persona.traits) },
      agentSeed: hash(agentSeed, index + 1),
      position: copy(START_POSITIONS[index]),
      cargo: { type: null, amount: 0 },
      lastResource: null,
      needs: { food: 0, water: 0 },
      action: null,
      pendingDelivery: null,
      inbox: [],
      memory: [],
      reflection: [],
      knowledge: { tick: 0, visible: [], frontier: 'workshop' },
      stats: { actions: {}, gathered: {}, delivered: {}, communication: 0, invalid: 0, idle: 0 },
    }));
    const world = {
      version: CONFIG.version,
      worldSeed,
      agentSeed,
      personaMode,
      tick: 0,
      status: 'RUNNING',
      launch: null,
      features: { persona: options.persona !== false, memory: options.memory !== false, reflection: options.reflection !== false, communication: options.communication !== false },
      storages: [{ id: 0, kind: 'CAMP', position: { x: 16, y: 16 }, resources: { ...emptyResources(), Food: 25, Water: 25 } }],
      nodes: copy(CONFIG.resourceNodes),
      buildings: [{ id: 'camp', name: 'Camp', tier: 0, position: { x: 16, y: 16 }, status: 'COMPLETE', inputs: {}, workRemaining: 0, reservedStorageId: 0 }],
      blueprints,
      recipes: copy(CONFIG.recipes),
      tech: { tier: 1, completed: [], frontier: CONFIG.techTiers[0].map((blueprint) => blueprint.id) },
      agents,
      pendingMessages: [],
      log: [],
      rawLog: [],
      metrics: { invalidActions: 0, abandonedWork: 0, opportunityCost: 0, communication: 0, completedActions: 0 },
    };
    event(world, 'EPISODE_STARTED', `World seed ${worldSeed} started`);
    return world;
  }

  function publicAgentView(agent) { return { id: agent.id, name: agent.name, position: copy(agent.position), action: agent.action ? { type: agent.action.type, targetId: agent.action.targetId || null } : null }; }
  function getObservation(world, agentId) {
    const agent = getAgent(world, agentId);
    if (!agent) throw new Error(`Unknown agent ${agentId}`);
    const visibleAgents = world.agents.filter((other) => other.id === agent.id || distance(agent.position, other.position) <= CONFIG.observationRange).map(publicAgentView);
    const visibleNodes = world.nodes.filter((node) => distance(agent.position, node.position) <= CONFIG.observationRange).map((node) => copy(node));
    const visibleBuildings = world.buildings.filter((building) => distance(agent.position, building.position) <= CONFIG.observationRange).map((building) => ({ id: building.id, name: building.name, position: copy(building.position), tier: building.tier, status: building.status }));
    agent.knowledge = { tick: world.tick, visible: visibleAgents.map((item) => item.id), frontier: world.tech.frontier[0] || null };
    return {
      tick: world.tick,
      episodeStatus: world.status,
      self: { id: agent.id, name: agent.name, persona: world.features.persona ? copy(agent.persona) : null, position: copy(agent.position), cargo: copy(agent.cargo), needs: copy(agent.needs), action: copy(agent.action), memory: world.features.memory ? agent.memory.slice().sort((a, b) => b.importance - a.importance || b.tick - a.tick).slice(0, 5) : [], reflection: world.features.reflection ? copy(agent.reflection) : [] },
      visible: { agents: visibleAgents, nodes: visibleNodes, buildings: visibleBuildings, storages: world.storages.filter((storage) => distance(agent.position, storage.position) <= CONFIG.observationRange).map((storage) => ({ id: storage.id, kind: storage.kind, position: copy(storage.position), resources: copy(storage.resources) })) },
      frontier: world.tech.frontier[0] ? { id: world.tech.frontier[0], tier: getBlueprint(world, world.tech.frontier[0]).tier } : null,
      inbox: copy(agent.inbox),
      commonKnowledge: { worldSize: copy(CONFIG.worldSize), observationRange: CONFIG.observationRange, actionDurations: copy(CONFIG.durations), maxTicks: CONFIG.maxTicks },
    };
  }

  function allObservations(world) { return Object.fromEntries(world.agents.map((agent) => [agent.id, getObservation(world, agent.id)])); }
  function recordAction(agent, type) { agent.stats.actions[type] = (agent.stats.actions[type] || 0) + 1; }
  function pushMemory(agent, item, importance = 1, enabled = true) { if (!enabled) return; agent.memory.unshift({ tick: item.tick, type: item.type, text: item.text, importance }); agent.memory = agent.memory.slice(0, 20); }

  function invalid(world, agent, intent, reason) {
    agent.stats.invalid += 1;
    world.metrics.invalidActions += 1;
    event(world, 'INVALID_ACTION', `${agent.name}: ${reason}`, { agentId: agent.id, intent });
    return false;
  }
  function canStartWork(agent, target) { return cardinallyAdjacent(agent.position, target.position); }
  function resourceAmount(storage, resource) { return storage.resources[resource] || 0; }
  function hasInputs(storage, inputs) { return Object.entries(inputs).every(([resource, amount]) => resourceAmount(storage, resource) >= amount); }
  function takeInputs(storage, inputs) { Object.entries(inputs).forEach(([resource, amount]) => { storage.resources[resource] -= amount; }); }
  function putResource(storage, resource, amount) { storage.resources[resource] = (storage.resources[resource] || 0) + amount; }
  function currentBuild(world, blueprintId) { return world.buildings.find((building) => building.id === blueprintId); }
  function isFrontier(world, blueprintId) { return world.tech.frontier[0] === blueprintId; }
  function isSameAction(agent, type, targetId) { return agent.action && agent.action.type === type && (!targetId || agent.action.targetId === targetId); }

  function startMove(world, agent, intent) {
    const target = intent && intent.target;
    const delta = target && { x: target.x - agent.position.x, y: target.y - agent.position.y };
    const cardinal = delta && ((delta.x === 0 && Math.abs(delta.y) >= 1) || (delta.y === 0 && Math.abs(delta.x) >= 1));
    if (!target || !inside(target) || !cardinal || distance(agent.position, target) > 4 || nodeAt(world, target) || buildingAt(world, target) || storageAt(world, target)) return invalid(world, agent, intent, 'MOVE requires up to four cardinal empty cells');
    agent.action = { type: 'MOVE', target: copy(target), remaining: CONFIG.durations.MOVE * actionMultiplier(agent), penalty: actionMultiplier(agent), startedAt: world.tick };
    recordAction(agent, 'MOVE');
    return true;
  }

  function startGather(world, agent, intent) {
    const node = getNode(world, intent && intent.nodeId);
    if (!node || !canStartWork(agent, node)) return invalid(world, agent, intent, 'GATHER requires a cardinal work position');
    if (agent.cargo.amount > 0 && agent.cargo.type !== node.resource) return invalid(world, agent, intent, 'cargo must be delivered before changing resource type');
    const base = node.kind === 'mineral' ? CONFIG.durations.MINERAL_GATHER : CONFIG.durations.GATHER;
    agent.action = { type: 'GATHER', targetId: node.id, resource: node.resource, remaining: base * actionMultiplier(agent), penalty: actionMultiplier(agent), workPosition: copy(agent.position), startedAt: world.tick };
    recordAction(agent, 'GATHER');
    return true;
  }

  function startTalk(world, agent, intent) {
    const recipient = getAgent(world, intent && intent.recipientId);
    const message = typeof (intent && intent.message) === 'string' ? intent.message.slice(0, CONFIG.messageBudget) : '';
    if (!world.features.communication) return invalid(world, agent, intent, 'communication is disabled for this episode');
    if (!recipient || recipient.id === agent.id || distance(agent.position, recipient.position) > CONFIG.observationRange) return invalid(world, agent, intent, 'TALK recipient must be within four cells');
    if (!message) return invalid(world, agent, intent, 'TALK requires a message');
    agent.action = { type: 'TALK', targetId: recipient.id, message, remaining: CONFIG.durations.TALK * actionMultiplier(agent), penalty: actionMultiplier(agent), startedAt: world.tick };
    recordAction(agent, 'TALK');
    return true;
  }

  function startProcess(world, agent, intent) {
    const storage = getStorage(world, intent && intent.storageId);
    const recipe = intent && (intent.recipe || world.recipes.find((item) => item.id === intent.recipeId));
    if (!storage || !recipe || !canStartWork(agent, storage) || !hasInputs(storage, recipe.inputs || {})) return invalid(world, agent, intent, 'PROCESS needs an adjacent storage with all inputs');
    if (world.tech.completed.indexOf(recipe.requires) === -1 && recipe.requires) return invalid(world, agent, intent, 'PROCESS recipe is not unlocked');
    takeInputs(storage, recipe.inputs || {});
    agent.action = { type: 'PROCESS', targetId: storage.id, recipe: copy(recipe), remaining: CONFIG.durations.PROCESS * actionMultiplier(agent), penalty: actionMultiplier(agent), workPosition: copy(agent.position), startedAt: world.tick };
    recordAction(agent, 'PROCESS');
    return true;
  }

  function buildCrew(world, blueprintId) { return world.agents.filter((agent) => agent.action && agent.action.type === 'BUILD' && agent.action.targetId === blueprintId); }
  function startBuild(world, agent, intent, crewReservations) {
    const blueprint = getBlueprint(world, intent && intent.buildingId);
    if (!blueprint || !isFrontier(world, blueprint.id)) return invalid(world, agent, intent, 'BUILD target is not the revealed Tech Frontier');
    let building = currentBuild(world, blueprint.id);
    if (building && building.status === 'COMPLETE') return invalid(world, agent, intent, 'building is already complete');
    const storage = getStorage(world, intent && intent.storageId);
    if (!storage || !canStartWork(agent, blueprint) || !cardinallyAdjacent(agent.position, blueprint.position)) return invalid(world, agent, intent, 'BUILD requires a cardinal work position');
    const occupied = new Set(buildCrew(world, blueprint.id).map((crewAgent) => pointKey(crewAgent.action.workPosition)));
    (crewReservations.get(blueprint.id) || []).forEach((position) => occupied.add(position));
    const key = pointKey(agent.position);
    if (occupied.has(key) || occupied.size >= 4) return invalid(world, agent, intent, 'construction work position is already occupied');
    if (!building) {
      if (!hasInputs(storage, blueprint.inputs)) return invalid(world, agent, intent, 'BUILD storage does not contain all inputs');
      takeInputs(storage, blueprint.inputs);
      building = { id: blueprint.id, name: blueprint.name, tier: blueprint.tier, position: copy(blueprint.position), status: 'UNDER_CONSTRUCTION', inputs: copy(blueprint.inputs), workRemaining: CONFIG.buildDurations[blueprint.tier], reservedStorageId: storage.id };
      world.buildings.push(building);
      event(world, 'BUILD_STARTED', `${blueprint.name} construction started`, { buildingId: blueprint.id, storageId: storage.id });
    }
    if (building.status !== 'UNDER_CONSTRUCTION') return invalid(world, agent, intent, 'building cannot accept crew');
    if (building.reservedStorageId !== storage.id) return invalid(world, agent, intent, 'all BUILD inputs must come from one storage');
    occupied.add(key);
    crewReservations.set(blueprint.id, Array.from(occupied));
    agent.action = { type: 'BUILD', targetId: blueprint.id, remaining: null, penalty: actionMultiplier(agent), workPosition: copy(agent.position), startedAt: world.tick };
    recordAction(agent, 'BUILD');
    return true;
  }

  function startLaunch(world, agent, intent) {
    const storage = getStorage(world, intent && intent.storageId);
    const spaceport = currentBuild(world, 'spaceport');
    if (!storage || !spaceport || spaceport.status !== 'COMPLETE' || resourceAmount(storage, 'Coal') !== 100 || !cardinallyAdjacent(agent.position, spaceport.position)) return invalid(world, agent, intent, 'LAUNCH needs a complete Spaceport, exact 100 Coal, and a work position');
    agent.action = { type: 'LAUNCH', targetId: 'spaceport', storageId: storage.id, remaining: CONFIG.durations.LAUNCH * actionMultiplier(agent), penalty: actionMultiplier(agent), startedAt: world.tick };
    recordAction(agent, 'LAUNCH');
    return true;
  }

  function startIntent(world, agent, intent, crewReservations) {
    const safeIntent = intent && typeof intent.type === 'string' ? intent : { type: 'WAIT' };
    if (agent.action) {
      if (safeIntent.type === 'ABANDON') {
        const lost = agent.action.remaining || 0;
        if (agent.action.type === 'BUILD') lost = currentBuild(world, agent.action.targetId)?.workRemaining || lost;
        world.metrics.abandonedWork += 1;
        world.metrics.opportunityCost += Math.max(0, lost);
        event(world, 'WORK_ABANDONED', `${agent.name} abandoned ${agent.action.type}`, { agentId: agent.id, action: agent.action.type, remaining: lost });
        agent.action = null;
        agent.stats.idle += 1;
        return true;
      }
      if (safeIntent.type === 'CONTINUE') return true;
      return invalid(world, agent, safeIntent, 'active Work Commitment requires CONTINUE or ABANDON');
    }
    switch (safeIntent.type) {
      case 'MOVE': return startMove(world, agent, safeIntent);
      case 'GATHER': return startGather(world, agent, safeIntent);
      case 'TALK': return startTalk(world, agent, safeIntent);
      case 'PROCESS': return startProcess(world, agent, safeIntent);
      case 'BUILD': return startBuild(world, agent, safeIntent, crewReservations);
      case 'LAUNCH': return startLaunch(world, agent, safeIntent);
      case 'WAIT':
        agent.action = { type: 'WAIT', remaining: CONFIG.durations.WAIT * actionMultiplier(agent), penalty: actionMultiplier(agent), startedAt: world.tick };
        recordAction(agent, 'WAIT');
        return true;
      default: return invalid(world, agent, safeIntent, 'unknown action type');
    }
  }

  function finishAction(world, agent) {
    const action = agent.action;
    if (!action) return;
    if (action.type === 'MOVE') {
      agent.position = copy(action.target);
      if (agent.cargo.amount > 0) {
        const storage = world.storages.find((item) => cardinallyAdjacent(agent.position, item.position));
        if (storage) agent.pendingDelivery = { storageId: storage.id, readyAt: world.tick + 1 };
      }
    }
    if (action.type === 'GATHER') {
      agent.cargo.type = action.resource;
      agent.cargo.amount += 1;
      agent.lastResource = action.resource;
      agent.stats.gathered[action.resource] = (agent.stats.gathered[action.resource] || 0) + 1;
      event(world, 'GATHER_COMPLETED', `${agent.name} gathered 1 ${action.resource}`, { agentId: agent.id, resource: action.resource });
      pushMemory(agent, { tick: world.tick, type: 'GATHER_COMPLETED', text: `Gathered ${action.resource}` }, 1, world.features.memory);
    }
    if (action.type === 'PROCESS') {
      const storage = getStorage(world, action.targetId);
      putResource(storage, action.recipe.output.resource, action.recipe.output.amount);
      event(world, 'PROCESS_COMPLETED', `${agent.name} processed ${action.recipe.output.resource}`, { agentId: agent.id, recipe: action.recipe.id });
    }
    if (action.type === 'TALK') {
      world.pendingMessages.push({ deliverAt: world.tick + 1, senderId: agent.id, recipientId: action.targetId, message: action.message });
      agent.stats.communication += 1;
      world.metrics.communication += 1;
      event(world, 'TALK_COMPLETED', `${agent.name} sent a private message`, { senderId: agent.id, recipientId: action.targetId });
    }
    if (action.type === 'LAUNCH') {
      world.status = 'LAUNCHED';
      world.launch = { tick: world.tick, day: Math.floor(world.tick / CONFIG.ticksPerDay) + 1, agentId: agent.id };
      event(world, 'LAUNCH_SUCCEEDED', 'Spaceport launch succeeded', copy(world.launch));
    }
    world.metrics.completedActions += 1;
    agent.action = null;
  }

  function finishBuilds(world) {
    world.buildings.filter((building) => building.status === 'UNDER_CONSTRUCTION').forEach((building) => {
      const crew = buildCrew(world, building.id);
      if (crew.length === 0) return;
      const work = crew.reduce((sum, agent) => sum + (1 / agent.action.penalty), 0);
      building.workRemaining -= work;
      if (building.workRemaining <= 0) {
        building.workRemaining = 0;
        building.status = 'COMPLETE';
        world.tech.completed.push(building.id);
        revealNextTier(world);
        event(world, 'BUILD_COMPLETED', `${building.name} completed`, { buildingId: building.id, crew: crew.length });
        if (building.id === 'warehouse' && !world.storages.some((storage) => storage.kind === 'WAREHOUSE')) {
          const nextStorageId = Math.max(...world.storages.map((storage) => storage.id)) + 1;
          world.storages.push({ id: nextStorageId, kind: 'WAREHOUSE', position: copy(building.position), resources: emptyResources() });
          event(world, 'STORAGE_UNLOCKED', 'Warehouse storage is now available', { storageId: nextStorageId });
        }
        crew.forEach((agent) => { agent.action = null; pushMemory(agent, { tick: world.tick, type: 'BUILD_COMPLETED', text: `${building.name} completed` }, 2, world.features.memory); });
      }
    });
  }

  function revealNextTier(world) {
    world.tech.frontier = world.tech.frontier.filter((id) => !world.tech.completed.includes(id));
    if (world.tech.frontier.length) return;
    const nextTier = world.tech.tier + 1;
    const blueprints = world.blueprints.filter((blueprint) => blueprint.tier === nextTier);
    if (!blueprints.length) return;
    world.tech.tier = nextTier;
    world.tech.frontier = blueprints.map((blueprint) => blueprint.id);
    event(world, 'TECH_TIER_REVEALED', `Tier ${nextTier} revealed`, { tier: nextTier, buildingIds: world.tech.frontier.slice() });
  }

  function deliverCargo(world) {
    world.agents.forEach((agent) => {
      if (!agent.pendingDelivery || agent.pendingDelivery.readyAt > world.tick) return;
      const storage = getStorage(world, agent.pendingDelivery.storageId);
      if (storage && cardinallyAdjacent(agent.position, storage.position) && agent.cargo.amount > 0) {
        putResource(storage, agent.cargo.type, agent.cargo.amount);
        agent.stats.delivered[agent.cargo.type] = (agent.stats.delivered[agent.cargo.type] || 0) + agent.cargo.amount;
        event(world, 'CARGO_DELIVERED', `${agent.name} delivered ${agent.cargo.amount} ${agent.cargo.type}`, { agentId: agent.id, storageId: storage.id, resource: agent.cargo.type, amount: agent.cargo.amount });
        agent.cargo = { type: null, amount: 0 };
      } else {
        event(world, 'DELIVERY_CANCELLED', `${agent.name} left the storage work position`, { agentId: agent.id, storageId: agent.pendingDelivery.storageId });
      }
      agent.pendingDelivery = null;
    });
  }

  function deliverMessages(world) {
    const ready = world.pendingMessages.filter((message) => message.deliverAt <= world.tick);
    world.pendingMessages = world.pendingMessages.filter((message) => message.deliverAt > world.tick);
    ready.forEach((message) => {
      const recipient = getAgent(world, message.recipientId);
      if (!recipient) return;
      recipient.inbox.push({ tick: world.tick, senderId: message.senderId, message: message.message });
      recipient.inbox = recipient.inbox.slice(-10);
    });
  }

  function stateHash(world) {
    return hash(world.worldSeed, world.tick, JSON.stringify({ status: world.status, agents: world.agents, storages: world.storages, buildings: world.buildings, metrics: world.metrics }));
  }

  function recordRawTick(world, observations, intents, results, beforeHash) {
    world.rawLog.push({
      tick: world.tick,
      diff: { stateHashBefore: beforeHash, stateHashAfter: stateHash(world) },
      observationHashes: Object.fromEntries(Object.entries(observations).map(([agentId, observation]) => [agentId, hash(world.worldSeed, world.tick, JSON.stringify(observation))])),
      rawOutputs: Object.fromEntries(world.agents.map((agent) => [agent.id, null])),
      parsedActions: copy(intents),
      validation: copy(results),
      resolverEvents: world.log.filter((item) => item.tick === world.tick).slice(),
      memory: Object.fromEntries(world.agents.map((agent) => [agent.id, copy(agent.memory.slice(0, 3))])),
      reflection: Object.fromEntries(world.agents.map((agent) => [agent.id, copy(agent.reflection.slice(0, 1))])),
      model: null,
      prompt: null,
    });
  }

  function upkeep(world) {
    if (world.tick === 0 || world.tick % CONFIG.ticksPerDay !== 0) return;
    const storages = world.storages.slice().sort((a, b) => a.id - b.id);
    world.agents.forEach((agent) => {
      for (const need of ['Food', 'Water']) {
        let paid = false;
        for (const storage of storages) {
          if (resourceAmount(storage, need) > 0) { storage.resources[need] -= 1; paid = true; break; }
        }
        const field = need.toLowerCase();
        agent.needs[field] = paid ? Math.min(0, agent.needs[field] + 1) : agent.needs[field] - 1;
        event(world, paid ? 'UPKEEP_PAID' : 'UPKEEP_MISSED', `${agent.name} ${need} upkeep ${paid ? 'paid' : 'missed'}`, { agentId: agent.id, need, paid, deficit: agent.needs[field] });
      }
    });
  }

  function reflection(world) {
    if (!world.features.reflection || world.tick === 0 || world.tick % CONFIG.ticksPerDay !== 0) return;
    world.agents.forEach((agent) => {
      const actionCounts = Object.entries(agent.stats.actions).sort((a, b) => b[1] - a[1]);
      const lead = actionCounts[0] ? actionCounts[0][0] : 'WAIT';
      agent.reflection.unshift({ tick: world.tick, type: 'DAILY_REFLECTION', confidence: 0.5, text: `오늘 가장 많이 한 행동은 ${lead}였습니다.` });
      agent.reflection = agent.reflection.slice(0, 10);
    });
    event(world, 'REFLECTION_COMPLETED', 'Daily reflection completed');
  }

  function step(world, intents = {}) {
    if (!world || world.status !== 'RUNNING') return { world, observations: allObservations(world), results: [] };
    if (world.tick >= CONFIG.maxTicks) { world.status = 'TIME_LIMIT'; event(world, 'TIME_LIMIT', 'Episode reached 2400 ticks'); return { world, observations: allObservations(world), results: [] }; }
    world.tick += 1;
    deliverMessages(world);
    upkeep(world);
    const observations = allObservations(world);
    const beforeHash = stateHash(world);
    const crewReservations = new Map();
    const results = [];
    world.agents.forEach((agent) => {
      if (!agent.action || !agent.action.workPosition || pointKey(agent.position) === pointKey(agent.action.workPosition)) return;
      const lost = agent.action.type === 'BUILD' ? currentBuild(world, agent.action.targetId)?.workRemaining || 0 : agent.action.remaining || 0;
      world.metrics.abandonedWork += 1;
      world.metrics.opportunityCost += Math.max(0, lost);
      event(world, 'WORK_ABANDONED', `${agent.name} left its work position`, { agentId: agent.id, action: agent.action.type, remaining: lost });
      agent.action = null;
    });
    stableOrder(world, world.agents, 'resolve').forEach((agent) => {
      const result = startIntent(world, agent, intents[agent.id] || { type: 'WAIT' }, crewReservations);
      results.push({ agentId: agent.id, accepted: result });
    });
    world.agents.forEach((agent) => {
      if (!agent.action) return;
      if (agent.action.type === 'BUILD') return;
      agent.action.remaining -= 1;
      if (agent.action.remaining <= 0) finishAction(world, agent);
    });
    finishBuilds(world);
    deliverCargo(world);
    reflection(world);
    recordRawTick(world, observations, intents, results, beforeHash);
    if (world.tick >= CONFIG.maxTicks && world.status === 'RUNNING') { world.status = 'TIME_LIMIT'; event(world, 'TIME_LIMIT', 'Episode reached 2400 ticks'); }
    return { world, observations, results };
  }

  function stepWithDecider(world, decider) {
    const observations = allObservations(world);
    const intents = {};
    world.agents.forEach((agent) => {
      let decision;
      try {
        decision = typeof decider === 'function' ? decider(copy(observations[agent.id]), world) : { type: 'WAIT' };
      } catch (error) {
        event(world, 'AGENT_RETRY', `${agent.name} decision failed; retrying once`, { agentId: agent.id, error: String(error && error.message || error) });
        try {
          decision = typeof decider === 'function' ? decider(copy(observations[agent.id]), world) : { type: 'WAIT' };
        } catch (retryError) {
          decision = { type: 'WAIT' };
          event(world, 'AGENT_FALLBACK', `${agent.name} decision failed; WAIT fallback used`, { agentId: agent.id });
        }
      }
      const validTypes = ['MOVE', 'GATHER', 'TALK', 'PROCESS', 'BUILD', 'LAUNCH', 'WAIT', 'CONTINUE', 'ABANDON'];
      if (!decision || typeof decision !== 'object' || !validTypes.includes(decision.type)) {
        event(world, 'AGENT_RETRY', `${agent.name} returned an invalid action; retrying once`, { agentId: agent.id });
        let retry;
        try {
          retry = typeof decider === 'function' ? decider(copy(observations[agent.id]), world) : { type: 'WAIT' };
        } catch (error) {
          retry = null;
        }
        if (retry && typeof retry === 'object' && validTypes.includes(retry.type)) decision = retry;
        else {
          decision = { type: 'WAIT' };
          event(world, 'AGENT_FALLBACK', `${agent.name} returned no valid action; WAIT fallback used`, { agentId: agent.id });
        }
      }
      intents[agent.id] = decision;
    });
    return step(world, intents);
  }

  function targetForAgent(agent, target) {
    const positions = workPositions(target);
    return positions[(agent.id - 1) % positions.length];
  }
  function moveOneStep(agent, target, world) {
    const candidates = DIRECTIONS.flatMap((direction) => [1, 2, 3, 4].map((steps) => ({ x: agent.position.x + direction.x * steps, y: agent.position.y + direction.y * steps })))
      .filter((point) => inside(point) && !nodeAt(world, point) && !buildingAt(world, point) && !storageAt(world, point))
      .sort((a, b) => {
        const distanceDifference = distance(a, target) - distance(b, target);
        if (distanceDifference) return distanceDifference;
        const horizontalFirst = Math.abs(target.x - agent.position.x) >= Math.abs(target.y - agent.position.y);
        const aAxis = horizontalFirst ? a.x !== agent.position.x : a.y !== agent.position.y;
        const bAxis = horizontalFirst ? b.x !== agent.position.x : b.y !== agent.position.y;
        return Number(bAxis) - Number(aAxis) || pointKey(a).localeCompare(pointKey(b));
      });
    if (candidates.length && distance(agent.position, target) > 0) return { type: 'MOVE', target: candidates[0] };
    return { type: 'WAIT' };
  }
  function chooseResource(world, blueprint, agent) {
    const storage = campStorage(world);
    const needs = Object.entries(blueprint ? blueprint.inputs : { Food: 12, Water: 12 }).filter(([resource, amount]) => resourceAmount(storage, resource) < amount);
    const survivalTarget = 30 + Math.ceil(trait(agent, 'planning') / 2);
    if (storage.resources.Food < survivalTarget && agent.id <= 3) return 'Food';
    if (storage.resources.Water < survivalTarget && agent.id >= 4) return 'Water';
    if (storage.resources.Food < 5) return 'Food';
    if (storage.resources.Water < 5) return 'Water';
    if (trait(agent, 'exploration') >= 8 && world.tick > 0 && world.tick % 48 === agent.id) {
      const unexplored = world.nodes.filter((node) => !agent.stats.gathered[node.resource]);
      if (unexplored.length) return unexplored[hash(agent.agentSeed, world.tick, 'exploration') % unexplored.length].resource;
    }
    if (agent.lastResource && trait(agent, 'roleConsistency') >= 7 && needs.some(([resource]) => resource === agent.lastResource)) return agent.lastResource;
    if (!needs.length) return null;
    if (trait(agent, 'planning') >= 7) return needs.slice().sort((a, b) => ((b[1] - resourceAmount(storage, b[0])) / b[1]) - ((a[1] - resourceAmount(storage, a[0])) / a[1]))[0][0];
    const offset = trait(agent, 'exploration') >= 6 ? hash(agent.agentSeed, Math.floor(world.tick / CONFIG.ticksPerDay), 'resource') : agent.id - 1;
    return needs[offset % needs.length][0];
  }
  function talkIntent(world, agent, blueprint) {
    const communication = trait(agent, 'communication');
    if (!world.features.communication || world.tick === 0 || world.tick % 12 !== agent.id % 12 || 1 + hash(agent.agentSeed, world.tick, 'talk') % 10 > communication) return null;
    const recipient = world.agents.filter((other) => other.id !== agent.id && distance(agent.position, other.position) <= CONFIG.observationRange).sort((a, b) => distance(agent.position, a.position) - distance(agent.position, b.position) || a.id - b.id)[0];
    if (!recipient) return null;
    const target = blueprint ? `${blueprint.name} 건설` : '생존 자원 확보';
    return { type: 'TALK', recipientId: recipient.id, message: `현재 목표는 ${target}. Food ${campStorage(world).resources.Food}, Water ${campStorage(world).resources.Water}.` };
  }
  function defaultPolicy(observation, world) {
    const agent = getAgent(world, observation.self.id);
    const storage = campStorage(world);
    const spaceport = currentBuild(world, 'spaceport');
    if (agent.action) {
      const survivalEmergency = storage.resources.Food < 5 || storage.resources.Water < 5;
      const survivalWork = agent.action.type === 'GATHER' && ['Food', 'Water'].includes(agent.action.resource);
      if (survivalEmergency && !survivalWork && trait(agent, 'persistence') <= 3) return { type: 'ABANDON' };
      const reconsideration = 1 + hash(agent.agentSeed, agent.action.startedAt, agent.action.type, 'persistence') % 10;
      if (agent.action.remaining > 1 && reconsideration > trait(agent, 'persistence') + 4) return { type: 'ABANDON' };
      return { type: 'CONTINUE' };
    }
    if (agent.cargo.amount > 0) {
      if (cardinallyAdjacent(agent.position, storage.position)) return { type: 'WAIT' };
      const normalBatchSize = 2 + Math.ceil(trait(agent, 'planning') / 2);
      const batchSize = agent.cargo.type === 'Coal' && spaceport && spaceport.status === 'COMPLETE' && agent.id === 1 ? Math.max(1, 100 - resourceAmount(storage, 'Coal')) : normalBatchSize;
      if (agent.cargo.amount < batchSize) {
        const node = world.nodes.find((item) => item.resource === agent.cargo.type);
        if (node && cardinallyAdjacent(agent.position, node.position)) return { type: 'GATHER', nodeId: node.id };
        if (node) return moveOneStep(agent, node.position, world);
      }
      return moveOneStep(agent, storage.position, world);
    }
    if (spaceport && spaceport.status === 'COMPLETE' && agent.id === 1) {
      if (resourceAmount(storage, 'Coal') < 100) {
        const coalNode = world.nodes.find((node) => node.resource === 'Coal');
        if (cardinallyAdjacent(agent.position, coalNode.position)) return { type: 'GATHER', nodeId: coalNode.id };
        return moveOneStep(agent, coalNode.position, world);
      }
      const launchPosition = targetForAgent(agent, spaceport.position);
      if (pointKey(agent.position) === pointKey(launchPosition)) return { type: 'LAUNCH', storageId: storage.id };
      return moveOneStep(agent, launchPosition, world);
    }
    const blueprint = world.tech.frontier[0] ? getBlueprint(world, world.tech.frontier[0]) : null;
    const conversation = talkIntent(world, agent, blueprint);
    if (conversation) return conversation;
    const building = blueprint && currentBuild(world, blueprint.id);
    if (building && building.status === 'UNDER_CONSTRUCTION') {
      const workPosition = targetForAgent(agent, building.position);
      if (cardinallyAdjacent(agent.position, building.position) && pointKey(agent.position) === pointKey(workPosition) && buildCrew(world, building.id).length < 4) return { type: 'BUILD', buildingId: building.id, storageId: building.reservedStorageId };
      if (buildCrew(world, building.id).length >= 4) return { type: 'WAIT' };
      return moveOneStep(agent, workPosition, world);
    }
    const resource = chooseResource(world, blueprint, agent);
    if (resource) {
      const node = world.nodes.find((item) => item.resource === resource);
      if (node && cardinallyAdjacent(agent.position, node.position)) return { type: 'GATHER', nodeId: node.id };
      if (node) return moveOneStep(agent, node.position, world);
    }
    if (blueprint && hasInputs(storage, blueprint.inputs)) {
      const workPosition = targetForAgent(agent, blueprint.position);
      if (pointKey(agent.position) === pointKey(workPosition)) return { type: 'BUILD', buildingId: blueprint.id, storageId: storage.id };
      return moveOneStep(agent, workPosition, world);
    }
    return { type: 'WAIT' };
  }

  function run(world, options = {}) {
    const decider = options.decider || defaultPolicy;
    const maxTicks = Math.min(options.maxTicks || CONFIG.maxTicks, CONFIG.maxTicks);
    while (world.status === 'RUNNING' && world.tick < maxTicks) stepWithDecider(world, decider);
    return world;
  }

  return { CONFIG, createWorld, getObservation, allObservations, step, stepWithDecider, run, defaultPolicy, helpers: { distance, cardinallyAdjacent, actionMultiplier } };
});
