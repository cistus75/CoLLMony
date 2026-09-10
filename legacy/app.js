const engine = window.CoLLMonyEngine;
let agentSeed = 1000;
let personaMode = 'random';
let world = engine.createWorld({ worldSeed: 427, agentSeed, personaMode });
let running = true;
let speed = 1;
let timer;
let selectedAgentId = 1;
let observationMode = false;

const COLORS = {
  A: ['#cb6d48', '#e4af7b'],
  B: ['#6e9d9c', '#dca77c'],
  C: ['#e2b760', '#f1c491'],
  D: ['#7e7b9a', '#d99570'],
  E: ['#819e5e', '#efc795'],
};
const $ = (selector) => document.querySelector(selector);
const camp = () => world.storages.find((storage) => storage.id === 0);
const currentFrontier = () => world.tech.frontier[0] ? world.blueprints.find((blueprint) => blueprint.id === world.tech.frontier[0]) : null;
const distance = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
function renderGrid() {
  const grid = $('#mapGrid');
  if (grid.childElementCount) return;
  const cells = [];
  for (let y = 0; y < engine.CONFIG.worldSize.height; y += 1) {
    for (let x = 0; x < engine.CONFIG.worldSize.width; x += 1) {
      const majorX = (x + 1) % 4 === 0 ? ' major-x' : '';
      const majorY = (y + 1) % 4 === 0 ? ' major-y' : '';
      cells.push(`<span class="map-cell${majorX}${majorY}" data-x="${x}" data-y="${y}" data-coordinate="${x},${y}"></span>`);
    }
  }
  grid.innerHTML = cells.join('');
}
function renderNodes() {
  const icons = { Food: '+', Water: '≈', Wood: '≋', Stone: '◆', Coal: '●', Iron: '◇', Fiber: '✿' };
  $('#nodeLayer').innerHTML = world.nodes.map((node) => `<div class="node map-object node-${node.resource.toLowerCase()}" data-x="${node.position.x}" data-y="${node.position.y}" style="--x:${node.position.x};--y:${node.position.y}" aria-label="${node.resource} resource node"><span class="node-icon">${icons[node.resource] || '•'}</span><b>${node.resource.toUpperCase()}</b></div>`).join('');
}
function renderBuildings() {
  $('#buildingLayer').innerHTML = world.buildings.filter((building) => building.id !== 'camp').map((building) => `<div class="map-building map-object ${building.status === 'COMPLETE' ? 'complete' : 'under-construction'}" data-x="${building.position.x}" data-y="${building.position.y}" style="--x:${building.position.x};--y:${building.position.y}" aria-label="${building.name}, ${building.status}"><span>${building.status === 'COMPLETE' ? '◆' : '…'}</span><b>${building.name}</b></div>`).join('');
}
function renderResources(storage) {
  const icons = { Food: '+', Water: '≈', Wood: '≋', Stone: '◆', Coal: '●', Iron: '◇', Fiber: '✿', Coke: '◈', Steel: '⬢', Textile: '▦', Glass: '◇', RocketFuel: '↑' };
  $('#resourceList').innerHTML = Object.keys(engine.CONFIG.resources).map((resource) => {
    const amount = storage.resources[resource] || 0;
    const kind = engine.CONFIG.resources[resource].kind;
    return `<div class="resource-row resource-${kind}"><span class="resource-symbol">${icons[resource] || '•'}</span><b>${engine.CONFIG.resources[resource].label}</b><strong>${String(amount).padStart(2, '0')}</strong></div>`;
  }).join('');
  document.querySelector('.storage-capacity').textContent = `${Object.values(storage.resources).reduce((sum, value) => sum + value, 0)} TOTAL`;
}
function renderTech(frontier) {
  const total = world.blueprints.length;
  const completed = world.buildings.filter((building) => building.status === 'COMPLETE' && building.id !== 'camp').length;
  const current = frontier ? world.buildings.find((building) => building.id === frontier.id) : null;
  $('#frontierName').textContent = frontier ? frontier.name : '모든 기술 완료';
  $('#frontierCopy').textContent = frontier ? `${Object.entries(frontier.inputs).map(([resource, amount]) => `${resource} ${amount}`).join(' · ')} · 티어 ${frontier.tier}` : '전체 건물 기술이 완료되었습니다.';
  $('#buildingProgress').textContent = `건물 ${completed} / ${total} · ${current?.status === 'UNDER_CONSTRUCTION' ? `건설 중 ${current.workRemaining} work` : '설계도 공개'}`;
}
const actionLabel = (agent) => {
  if (agent.action?.type === 'GATHER') return `자원 채집 중 · ${agent.action.resource}`;
  if (agent.action?.type === 'BUILD') return `건설 중 · ${agent.action.targetId}`;
  if (agent.action?.type === 'TALK') return '다른 에이전트와 대화 중';
  if (agent.action?.type === 'PROCESS') return '가공 중';
  if (agent.action?.type === 'LAUNCH') return '발사 준비 중';
  if (agent.cargo.amount > 0) return `${agent.cargo.type}을(를) 캠프로 운반 중`;
  if (agent.action?.type === 'WAIT') return '다음 결정을 기다리는 중';
  return '다음 작업으로 이동 중';
};
const actionStatus = (agent) => agent.action?.type || (agent.cargo.amount > 0 ? 'DELIVERING' : 'MOVING');

function formatEvent(item) {
  const data = item.data || {};
  const names = Object.fromEntries(world.agents.map((agent) => [agent.id, agent.name]));
  if (item.type === 'GATHER_COMPLETED') return { symbol: '+', text: `${names[data.agentId] || 'Agent'}가 ${data.resource} 1개를 채집했습니다.` };
  if (item.type === 'CARGO_DELIVERED') return { symbol: '↗', text: `${names[data.agentId] || 'Agent'}가 ${data.resource} ${data.amount}개를 캠프에 전달했습니다.` };
  if (item.type === 'BUILD_STARTED') return { symbol: '⌂', text: `${item.message} · 재료가 창고에서 차감되었습니다.` };
  if (item.type === 'BUILD_COMPLETED') return { symbol: '◆', text: `${item.message} · 다음 기술 프론티어가 공개되었습니다.` };
  if (item.type === 'TALK_COMPLETED') return { symbol: '↔', text: `${names[data.senderId] || 'Agent'}가 개인 메시지를 보냈습니다.` };
  if (item.type === 'UPKEEP_MISSED') return { symbol: '!', text: item.message };
  if (item.type === 'LAUNCH_SUCCEEDED') return { symbol: '↑', text: 'Spaceport 발사 성공. Episode가 종료되었습니다.' };
  return { symbol: '•', text: item.message };
}

function renderAgents() {
  $('#agentList').innerHTML = world.agents.map((agent) => {
    const [color, skin] = COLORS[agent.name];
    const status = actionStatus(agent);
    const traits = agent.persona.traits;
    return `<button class="agent-row ${agent.id === selectedAgentId ? 'selected' : ''}" type="button" data-select-agent="${agent.id}"><span class="mini-avatar" style="--agent-color:${color};--skin:${skin}"></span><span><b>Agent ${agent.name}</b><small>탐${traits.exploration} · 계${traits.planning} · 대${traits.communication} · 유${traits.persistence} · 반${traits.roleConsistency}</small></span><strong class="${status.toLowerCase()}">${status}</strong></button>`;
  }).join('');
}

function renderPersona(agent) {
  const actionEntries = Object.entries(agent.stats.actions).sort((a, b) => b[1] - a[1]);
  $('#personaTitle').textContent = `AGENT ${agent.name} · SEED ${world.agentSeed}`;
  $('#traitList').innerHTML = Object.entries(engine.CONFIG.traits).map(([trait, label]) => {
    const score = agent.persona.traits[trait];
    return `<div class="trait-row"><span>${label}</span><div><i style="width:${score * 10}%"></i></div><strong>${score}</strong></div>`;
  }).join('');
  $('#behaviorStats').textContent = actionEntries.length ? actionEntries.slice(0, 3).map(([action, count]) => `${action} ${count}`).join(' · ') : '아직 선택 기록이 없습니다.';
  $('#personaModeSelect').value = personaMode;
  $('#rerollPersona').textContent = `SEED ${agentSeed} +`;
}

function renderObservation() {
  const selected = world.agents.find((agent) => agent.id === selectedAgentId);
  const map = $('#map');
  map.classList.toggle('observation-mode', observationMode);
  document.querySelectorAll('.map-cell').forEach((cell) => {
    const point = { x: Number(cell.dataset.x), y: Number(cell.dataset.y) };
    cell.classList.toggle('visible-to-agent', observationMode && distance(selected.position, point) <= engine.CONFIG.observationRange);
    cell.classList.toggle('agent-cell', point.x === selected.position.x && point.y === selected.position.y);
  });
  document.querySelectorAll('.map-object').forEach((element) => {
    const point = { x: Number(element.dataset.x), y: Number(element.dataset.y) };
    element.classList.toggle('outside-observation', observationMode && distance(selected.position, point) > engine.CONFIG.observationRange);
  });
  document.querySelectorAll('.agent').forEach((element) => {
    const agent = world.agents.find((item) => item.id === Number(element.dataset.agentId));
    element.classList.toggle('selected', agent.id === selectedAgentId);
    element.classList.toggle('outside-observation', observationMode && agent.id !== selectedAgentId && distance(selected.position, agent.position) > engine.CONFIG.observationRange);
  });
  $('#selectionReadout').textContent = `${selected.name.toUpperCase()} · (${selected.position.x}, ${selected.position.y}) · ${actionStatus(selected)}`;
  $('#viewButton').textContent = observationMode ? `${selected.name} 관측` : '전체 시야';
}

function renderEvents() {
  const events = world.log.slice(-3).reverse().map((item) => ({ ...formatEvent(item), time: `TICK ${String(item.tick).padStart(4, '0')}` }));
  $('#eventList').innerHTML = events.map((item) => `<article class="event-item"><span class="event-mark">${item.symbol}</span><div><p>${item.text}</p><time>${item.time}</time></div></article>`).join('');
}

function positionAgents() {
  world.agents.forEach((agent) => {
    const element = document.querySelector(`[data-agent-id="${agent.id}"]`);
    if (!element) return;
    element.style.setProperty('--x', agent.position.x);
    element.style.setProperty('--y', agent.position.y);
    element.classList.toggle('is-working', ['GATHER', 'BUILD', 'PROCESS'].includes(agent.action?.type));
    element.classList.toggle('is-talking', agent.action?.type === 'TALK');
    element.setAttribute('aria-label', `${agent.name}, ${actionLabel(agent)}`);
  });
}

function render() {
  const storage = camp();
  const frontier = currentFrontier();
  const hour = String(world.tick % engine.CONFIG.ticksPerDay).padStart(2, '0');
  renderGrid();
  renderNodes();
  renderBuildings();
  document.querySelector('.camp').style.setProperty('--x', camp().position.x);
  document.querySelector('.camp').style.setProperty('--y', camp().position.y);
  positionAgents();
  renderAgents();
  renderEvents();
  renderResources(storage);
  renderTech(frontier);
  renderObservation();
  renderPersona(world.agents.find((agent) => agent.id === selectedAgentId));
  $('#tickCounter').textContent = `TICK ${String(world.tick).padStart(4, '0')} / ${engine.CONFIG.maxTicks}`;
  $('#worldTime').textContent = `DAY ${String(Math.floor(world.tick / engine.CONFIG.ticksPerDay) + 1).padStart(2, '0')} · ${hour}:00`;
  $('#runState').textContent = world.status === 'LAUNCHED' ? 'EPISODE COMPLETE' : world.status === 'TIME_LIMIT' ? 'TIME LIMIT' : running ? 'HEURISTIC AGENTS' : 'SIMULATION PAUSED';
  const frontierInputs = frontier ? Object.entries(frontier.inputs) : [];
  const frontierProgress = frontierInputs.length ? frontierInputs.reduce((sum, [resource, amount]) => sum + Math.min(1, (storage.resources[resource] || 0) / amount), 0) / frontierInputs.length : 1;
  $('#frontierBar').style.width = `${frontierProgress * 100}%`;
  $('#frontierLabel').textContent = frontier ? frontierInputs.map(([resource, amount]) => `${resource.toUpperCase()} ${storage.resources[resource] || 0}/${amount}`).join(' · ') : 'ALL FRONTIERS COMPLETE';
  document.querySelectorAll('.agent').forEach((element) => element.classList.toggle('is-paused', !running));
}

function syncRunState() {
  $('#playLabel').textContent = running ? 'PAUSE' : 'PLAY';
  $('#playButton').innerHTML = running ? '<span class="pause-glyph"></span><span id="playLabel">PAUSE</span>' : '<span class="play-glyph"></span><span id="playLabel">PLAY</span>';
  $('#livePulse').parentElement.parentElement.classList.toggle('paused', !running);
}

function advance() {
  if (world.status !== 'RUNNING') return;
  engine.stepWithDecider(world, engine.defaultPolicy);
  render();
  if (world.status !== 'RUNNING') { running = false; syncRunState(); }
}

function step() {
  if (!running) return;
  advance();
}

function schedule() {
  clearInterval(timer);
  timer = setInterval(step, 900 / speed);
}

$('#playButton').addEventListener('click', () => { running = !running; syncRunState(); });
$('#stepButton').addEventListener('click', () => { running = false; syncRunState(); advance(); });
$('#viewButton').addEventListener('click', () => { observationMode = !observationMode; render(); });
document.querySelectorAll('.speed-button').forEach((button) => button.addEventListener('click', () => {
  speed = Number(button.dataset.speed);
  document.querySelectorAll('.speed-button').forEach((item) => item.classList.toggle('active', item === button));
  schedule();
}));
$('#resetButton').addEventListener('click', () => {
  world = engine.createWorld({ worldSeed: 427, agentSeed, personaMode });
  running = true;
  selectedAgentId = 1;
  observationMode = false;
  syncRunState();
  render();
});
$('#personaModeSelect').addEventListener('change', (event) => {
  personaMode = event.target.value;
  world = engine.createWorld({ worldSeed: 427, agentSeed, personaMode });
  running = true;
  selectedAgentId = 1;
  syncRunState();
  render();
});
$('#rerollPersona').addEventListener('click', () => {
  agentSeed += 1;
  world = engine.createWorld({ worldSeed: 427, agentSeed, personaMode });
  running = true;
  selectedAgentId = 1;
  syncRunState();
  render();
});
$('#agentList').addEventListener('click', (event) => {
  const row = event.target.closest('[data-select-agent]');
  if (!row) return;
  selectedAgentId = Number(row.dataset.selectAgent);
  observationMode = true;
  render();
});
document.querySelectorAll('.agent').forEach((element) => {
  const select = () => { selectedAgentId = Number(element.dataset.agentId); observationMode = true; render(); };
  element.addEventListener('click', select);
  element.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') select(); });
});

render();
syncRunState();
schedule();
