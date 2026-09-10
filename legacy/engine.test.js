const assert = require('node:assert/strict');
const engine = require('./engine.js');

function testSeededPersonas() {
  const first = engine.createWorld({ agentSeed: 1234, personaMode: 'random' });
  const second = engine.createWorld({ agentSeed: 1234, personaMode: 'random' });
  const different = engine.createWorld({ agentSeed: 1235, personaMode: 'random' });
  assert.deepEqual(first.agents.map((agent) => agent.name), ['A', 'B', 'C', 'D', 'E']);
  assert.deepEqual(first.agents.map((agent) => agent.persona), second.agents.map((agent) => agent.persona));
  assert.notDeepEqual(first.agents.map((agent) => agent.persona), different.agents.map((agent) => agent.persona));
  first.agents.forEach((agent) => Object.values(agent.persona.traits).forEach((score) => assert.ok(Number.isInteger(score) && score >= 1 && score <= 10)));

  const neutral = engine.createWorld({ agentSeed: 1234, personaMode: 'neutral' });
  neutral.agents.forEach((agent) => assert.deepEqual(Object.values(agent.persona.traits), [5, 5, 5, 5, 5]));

  const homogeneous = engine.createWorld({ agentSeed: 1234, personaMode: 'homogeneous' });
  homogeneous.agents.forEach((agent) => assert.deepEqual(agent.persona.traits, homogeneous.agents[0].persona.traits));

  const diverse = engine.createWorld({ agentSeed: 1234, personaMode: 'diverse' });
  Object.keys(engine.CONFIG.traits).forEach((trait) => assert.deepEqual(diverse.agents.map((agent) => agent.persona.traits[trait]).sort((a, b) => a - b), [2, 4, 6, 8, 10]));
}

function testActionDurationsAndCargo() {
  const world = engine.createWorld({ worldSeed: 1 });
  const agent = world.agents[0];
  const foodNode = world.nodes.find((node) => node.id === 'food-node');
  agent.position = { x: foodNode.position.x - 1, y: foodNode.position.y };
  engine.step(world, { 1: { type: 'GATHER', nodeId: 'food-node' } });
  assert.equal(agent.cargo.amount, 0);
  engine.step(world, { 1: { type: 'CONTINUE' } });
  assert.deepEqual(agent.cargo, { type: 'Food', amount: 1 });
  agent.position = { x: world.storages[0].position.x - 1, y: world.storages[0].position.y };
  agent.pendingDelivery = { storageId: 0, readyAt: world.tick + 1 };
  engine.step(world, { 1: { type: 'WAIT' } });
  assert.equal(agent.cargo.amount, 0);
  assert.equal(world.storages[0].resources.Food, 26);
}

function testDocumentWorldAndMovementRules() {
  const world = engine.createWorld({ worldSeed: 6 });
  assert.deepEqual(engine.CONFIG.worldSize, { width: 32, height: 32 });
  world.agents[0].position = { x: 1, y: 1 };
  engine.step(world, { 1: { type: 'MOVE', target: { x: 5, y: 1 } } });
  assert.deepEqual(world.agents[0].position, { x: 5, y: 1 });
  world.agents[0].position = { x: 1, y: 1 };
  engine.step(world, { 1: { type: 'MOVE', target: { x: 3, y: 3 } } });
  assert.equal(world.metrics.invalidActions, 1);
  assert.equal(world.rawLog.length, 2);
}

function testWorkCommitmentRequiresContinueOrAbandon() {
  const world = engine.createWorld({ worldSeed: 7 });
  const stoneNode = world.nodes.find((node) => node.id === 'stone-node');
  world.agents[0].position = { x: stoneNode.position.x - 1, y: stoneNode.position.y };
  engine.step(world, { 1: { type: 'GATHER', nodeId: 'stone-node' } });
  engine.step(world, { 1: { type: 'WAIT' } });
  assert.equal(world.metrics.invalidActions, 1);
  assert.equal(world.agents[0].action.type, 'GATHER');
  engine.step(world, { 1: { type: 'ABANDON' } });
  assert.equal(world.agents[0].action, null);
}

function testPrivateTalkArrivesOnNextTick() {
  const world = engine.createWorld({ worldSeed: 2 });
  world.agents[0].position = { x: 7, y: 5 };
  world.agents[1].position = { x: 7, y: 4 };
  engine.step(world, { 1: { type: 'TALK', recipientId: 2, message: 'wood is north' } });
  assert.equal(world.agents[1].inbox.length, 0);
  engine.step(world, { 1: { type: 'WAIT' } });
  assert.equal(world.agents[1].inbox[0].message, 'wood is north');
  assert.equal(world.metrics.communication, 1);
}

function testDeliveryCancelsWhenAgentLeavesAdjacency() {
  const world = engine.createWorld({ worldSeed: 8 });
  const agent = world.agents[0];
  const camp = world.storages[0];
  agent.position = { x: camp.position.x - 1, y: camp.position.y };
  agent.cargo = { type: 'Wood', amount: 1 };
  agent.pendingDelivery = { storageId: 0, readyAt: world.tick + 1 };
  engine.step(world, { 1: { type: 'MOVE', target: { x: camp.position.x - 2, y: camp.position.y } } });
  assert.equal(agent.cargo.amount, 1);
  assert.equal(agent.pendingDelivery, null);
  assert.equal(world.log.at(-1).type, 'DELIVERY_CANCELLED');
}

function testUpkeepCreatesDeficitWithoutKillingAgent() {
  const world = engine.createWorld({ worldSeed: 3 });
  world.storages[0].resources.Food = 0;
  world.storages[0].resources.Water = 0;
  for (let tick = 0; tick < engine.CONFIG.ticksPerDay; tick += 1) engine.step(world, {});
  assert.equal(world.status, 'RUNNING');
  assert.equal(world.agents[0].needs.food, -1);
  assert.equal(world.agents[0].needs.water, -1);
  assert.equal(engine.helpers.actionMultiplier(world.agents[0]), 2);
}

function testConstructionCrewAndTechFrontier() {
  const world = engine.createWorld({ worldSeed: 4 });
  world.storages[0].resources.Wood = 10;
  world.storages[0].resources.Stone = 4;
  const workshop = world.blueprints.find((blueprint) => blueprint.id === 'workshop');
  const positions = [{ x: workshop.position.x - 1, y: workshop.position.y }, { x: workshop.position.x, y: workshop.position.y - 1 }, { x: workshop.position.x + 1, y: workshop.position.y }, { x: workshop.position.x, y: workshop.position.y + 1 }];
  world.agents.slice(0, 4).forEach((agent, index) => { agent.position = positions[index]; });
  const intents = Object.fromEntries(world.agents.slice(0, 4).map((agent) => [agent.id, { type: 'BUILD', buildingId: 'workshop', storageId: 0 }]));
  engine.step(world, intents);
  assert.equal(world.storages[0].resources.Wood, 0);
  assert.equal(world.buildings.find((building) => building.id === 'workshop').workRemaining, 4);
  engine.step(world, { 1: { type: 'CONTINUE' }, 2: { type: 'CONTINUE' }, 3: { type: 'CONTINUE' }, 4: { type: 'CONTINUE' } });
  assert.equal(world.buildings.find((building) => building.id === 'workshop').status, 'COMPLETE');
  assert.deepEqual(world.tech.frontier, ['kiln', 'quarry', 'warehouse']);
}

function testExactLaunchFuel() {
  const world = engine.createWorld({ worldSeed: 5 });
  world.buildings.push({ id: 'spaceport', name: 'Spaceport', tier: 5, position: { x: 10, y: 5 }, status: 'COMPLETE', inputs: {}, workRemaining: 0, reservedStorageId: 0 });
  world.agents[0].position = { x: 9, y: 5 };
  world.storages[0].resources.Coal = 100;
  engine.step(world, { 1: { type: 'LAUNCH', storageId: 0 } });
  assert.equal(world.status, 'LAUNCHED');
  assert.equal(world.launch.tick, 1);
}

function testDeterminism() {
  const first = engine.run(engine.createWorld({ worldSeed: 427, agentSeed: 1000 }), { maxTicks: 80 });
  const second = engine.run(engine.createWorld({ worldSeed: 427, agentSeed: 1000 }), { maxTicks: 80 });
  assert.deepEqual(first, second);
}

function testDefaultPolicyCompletesTheScenario() {
  const world = engine.run(engine.createWorld({ worldSeed: 427, agentSeed: 1000 }), { maxTicks: 2000 });
  assert.equal(world.status, 'LAUNCHED');
  assert.equal(world.tech.completed.length, 17);
  assert.equal(world.storages[0].resources.Coal, 100);
}

testSeededPersonas();
testActionDurationsAndCargo();
testDocumentWorldAndMovementRules();
testWorkCommitmentRequiresContinueOrAbandon();
testPrivateTalkArrivesOnNextTick();
testDeliveryCancelsWhenAgentLeavesAdjacency();
testUpkeepCreatesDeficitWithoutKillingAgent();
testConstructionCrewAndTechFrontier();
testExactLaunchFuel();
testDeterminism();
testDefaultPolicyCompletesTheScenario();
console.log('engine tests passed');
