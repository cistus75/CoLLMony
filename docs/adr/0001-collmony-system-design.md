# CoLLMony domain and system design decisions

CoLLMony is a deterministic research simulation for studying long-horizon cooperation among locally hosted LLM Agents. The World engine owns state, legality, timing, resource accounting, technology progression, and outcomes. Agents receive observations and select high-level actions. This document preserves the agreed domain definitions and MVP rules in one place.

## Domain definitions

**World** is the shared 32×32 simulated environment containing locations, Resource Nodes, buildings, technology, Storage, time, and launch progress. Its dimensions are fixed and Camp occupies the central four cells.

**Agent** is an individual decision-maker with its own Persona, Partial Observation, carried cargo, and needs. Knowledge, Memory, Reflection, and communication history are planned extensions.

**Tick** is one simulated hour and one deterministic World resolution interval. A new Agent decision is requested only when ongoing deterministic work does not already determine the next action. A Simulation Day is 24 Ticks, and an Episode lasts at most 100 Simulation Days, or 2,400 Ticks.

**Episode** is one reproducible World run from an immutable Run Configuration until successful Launch or the 2,400-Tick limit.

**Run Configuration** is the immutable snapshot of Config Version, World Seed, Agent Seed, Agent Population, Persona Mode, feature switches, and Observation Policy captured when an Episode starts. Each Episode has a unique Run ID. Config Version starts at `1` and identifies benchmark-affecting rule and configuration changes.

**Partial Observation** is the Agent-specific projection of the World available at a decision point. It is not the raw global World state.

**Knowledge** is a planned record of what an Agent has learned. It will remain distinct from actual World state and may become stale or wrong.

**High-level Action** is an Agent-selected intent such as MOVE, GATHER, PROCESS, BUILD, DELIVER, WAIT, CONTINUE, ABANDON, or LAUNCH. The deterministic World validates and resolves the intent.

**Persona** is a stable behavioral identity that changes preferences such as risk appetite, exploration tendency, cooperation tendency, time preference, and priorities. Persona does not restrict action space or hard capabilities and remains fixed during an Episode. Explicit professions are not assigned; role differentiation is an observed behavioral outcome.

**Memory** is an Agent's fixed-size, retrievable record of prior experience. The research raw log is separate and retains the complete event history.

**Reflection** is a distinct process that generalizes experience into structured `belief`, `lesson`, or `strategy` guidance. Reflection may change beliefs and strategy, but not Persona or actual World state.

**Communication** is the planned exchange of explicit private messages between Agents. The current deterministic resolver does not implement TALK or message delivery.

**Resource Node** is an inexhaustible source of a gatherable resource. Resource types and counts are configured, while each Episode generates legal positions deterministically from World Seed and then keeps those positions fixed.

**Building Blueprint** is shared non-spatial technology knowledge containing identity, Tier, footprint size, construction inputs, and capability without a map position.

**Construction Site** is the physical footprint fixed by the first legal BUILD placement intent for a revealed Building Blueprint. The same intent selects an existing Storage with all required resources, and that Storage remains fixed for the site.

**Survival Resource** is Food or Water consumed by daily Agent upkeep and gathered directly from a Resource Node.

**Raw Resource** is gathered directly from a Resource Node and used in construction or a Production Recipe.

**Processed Resource** is produced from Raw Resources through a Production Recipe after its required production building is complete.

**Component** is a higher-order manufactured resource used in advanced buildings or the Rocket.

**Production Recipe** is a configured transformation that consumes input resources and produces one output resource at a required production building.

**Work Position** is one of the four orthogonally adjacent cells from which an Agent performs work on a Resource Node, building, or other target. Agents never stand on target tiles while working.

**Work Commitment** is an ongoing personal GATHER or PROCESS action that continues until completion or explicit abandonment. BUILD uses repeated per-Tick Construction Crew participation instead.

**Opportunity Cost** is the time and alternative progress lost by committing to, interrupting, or abandoning an action.

**Construction Crew** is the set of Agents simultaneously working on one building, with at most one Agent on each of its four orthogonally adjacent Work Positions.

**Camp** is the shared starting structure. Every participating Agent starts within one cell of Camp, including diagonal cells. Camp is also a permanent Storage location.

**Storage** is a resource-holding location such as Camp or a later Warehouse. Each Storage has an independent resource pool. Resources are not automatically shared between Storage locations.

**Carried Cargo** is the resource state held by an Agent while transporting gathered material. An Agent may carry a configured batch of three units of exactly one resource type at a time.

**Food and Water Needs** are per-Agent daily upkeep requirements of one Food and one Water.

**Need Deficit** is a negative Food or Water value caused by unpaid upkeep. The more negative of the two deficits determines the Agent's duration multiplier.

**Tech Frontier** is globally shared non-spatial knowledge containing currently revealed Building Blueprints, completed technology, and Production Recipes enabled by completed buildings. The full future dependency graph is not initially disclosed.

**Tech Tier** is one of five ordered technology levels. The Tiers contain 1, 3, 5, 7, and 2 buildings respectively. Every building in the current Tier must be complete before the next Tier is revealed.

**Launchpad** is the Tier 5 building from which the completed Rocket is launched and is a separate construction target from the Rocket.

**Rocket** is the Tier 5 vehicle assembled from advanced Components. It must be complete and fueled before Launch.

**Launch** is the final one-Tick action performed after both the Launchpad and Rocket are complete and 30 Rocket Fuel is available in the selected Storage. It consumes that fuel and is separate from their BUILD actions.

## Clock, decisions, and resolution

The World advances every Tick. Agents whose current controller flow requires a new decision receive their same-Tick observations before any action result is resolved. The deterministic resolver can continue ongoing work without a new Controller or LLM inference and handles legality, action duration, resource effects, movement, construction, and conflicts. Agents do not receive same-Tick feedback before the next decision point.

The initial action durations are:

- MOVE: one Tick for up to four cardinal cells
- ordinary GATHER: two Ticks
- mineral GATHER: four Ticks
- PROCESS: two Ticks initially
- WAIT: one Tick
- LAUNCH: one Tick
- BUILD: eight Ticks for Tier 1, then 16, 32, 64, and 128 Ticks for Tiers 2–5 before crew reduction

The exact building roster, recipes, and any PROCESS/BUILD exceptions are configuration data and must be versioned before benchmark runs.

Movement is cardinal only; diagonal movement is not allowed. The initial World has no obstacles or line-of-sight system. Movement and spatial action legality are deterministic. Invalid actions are not silently repaired.

Agents do not block one another's movement and may occupy the same grid cell. Static World entities remain blocking.

After a personal GATHER or PROCESS Work Commitment starts, the deterministic controller flow can continue it without a fresh decision. An explicit ABANDON action ends it, as does leaving the Work Position. Abandoned work yields no partial resource reward.

Active BUILD participation is represented by a BUILD action on every participation Tick, but the deterministic controller flow can supply continuation actions without a fresh inference. When a new controller decision is requested, changing intent or leaving the assigned Work Position ends that Agent's participation and records a construction abandonment, while shared building progress remains. Construction Crew membership may therefore change without a separate personal construction commitment object.

The first BUILD intent for an unplaced Building includes the desired top-left footprint coordinate and an explicit Storage ID. The World validates that the Storage exists, holds all required inputs, and that normal placement rules pass. It rejects an invalid selection without substituting a nearer Storage. A valid position and Storage become fixed, and later participants may submit only the Building identity. Unplaced Buildings have no footprint, do not block movement, and are absent from physical observations while remaining available as revealed Tech Frontier knowledge.

Construction crew reduction is calculated first as `ceil(base_duration / crew_size)`, with a minimum of one Tick. Crew can join or leave during construction; remaining work is resolved from the current crew. Multi-Agent duration reduction applies to BUILD only. GATHER and PROCESS remain individual work.

Exclusive claims use an Agent Seed-based deterministic tie-break rather than permanently privileging a fixed Agent ID. Non-conflicting actions retain their normal order. Resource gathering itself has no finite-resource contention because Resource Nodes are inexhaustible.

## Observation and information boundaries

Partial Observation uses the Run Configuration's Manhattan field radius. Disabling it exposes the full World projection. Within the active projection, an Agent can see relevant positions and visible current actions. Other Agents' private Persona, Memory, carried cargo, and private message history are hidden. The Agent receives its observation projection, not raw global World state.

The full map, global resource quantities, full Tech tree, remote Storage quantities, and other Agents' private state are not initially disclosed. Persistent remote facts and stale Knowledge require the future Knowledge or Communication integration.

The initial common knowledge includes the action schema, basic movement rules, the Agent's own state, and the local observation. Currently revealed Building Blueprints include their size and required resources. Completed technology and recipes enabled by completed production buildings are shared independently of FOV, while physical locations and physical building state still follow Partial Observation and the complete future dependency graph remains hidden.

## Spatial work and resources

All GATHER, PROCESS, and BUILD actions require the Agent to occupy one of the target's four cardinally adjacent cells. A Resource Node or building is never occupied by the working Agent.

Each completed GATHER produces exactly one unit after the full Action Duration. There is no partial output. After completion, another GATHER must be explicitly selected; automatic repeat is not used. Multiple Agents may gather simultaneously from the same Resource Node as independent personal Work Commitments.

An Agent can carry at most three units of one resource type. The Agent must deliver its current Carried Cargo before switching to another resource type. There is no initial discard action.

## Camp, Warehouse, and logistics

Camp begins as the shared starting Storage and remains available throughout the Episode. Technology progression can unlock additional Warehouses, which are BUILD targets with independent Storage pools and strategically placeable locations. Camp and Warehouses do not automatically share ordinary resources.

Resource Delivery is an explicit one-Tick DELIVER action from one of a Storage's four cardinally adjacent Work Positions. Reaching the Work Position alone does not transfer Carried Cargo. There is no separate DEPOSIT action, and the same delivery rule applies to Camp and every Warehouse.

PROCESS consumes all inputs at start from one selected Storage and places its output in that same Storage at completion. The first BUILD explicitly selects one existing Storage that already contains all required inputs; the site keeps that Storage for all later construction participation. Carried resources cannot be consumed directly. A single PROCESS or BUILD action cannot combine inputs from multiple Storage pools.

Food and Water upkeep is the exception to independent ordinary Storage pools. Once Warehouses exist, upkeep can use the global total across all Storage locations. When a need is present in multiple Storage locations, the resolver consumes from the lowest Storage ID first.

## Food and Water needs

Each Agent consumes one Food and one Water per Simulation Day. The initial Camp Storage contains 25 Food and 25 Water, covering five days of upkeep for five Agents. Upkeep is processed at the day boundary and does not kill an Agent when unpaid.

If either need is negative, the more negative deficit determines the duration multiplier for every implemented action, including MOVE, GATHER, PROCESS, BUILD, DELIVER, and WAIT. A deficit of -1 makes an action take twice its base duration, -2 makes it take three times its base duration, -3 makes it take four times its base duration, and so on without an upper limit. The penalty is calculated at action start and remains fixed for that action.

Food and Water deficits accumulate independently without an upper limit while unpaid. Each need recovers independently by one for each successfully paid daily upkeep. Food and Water are ordinary resources for gathering and cargo purposes: each completed gathering action produces one unit, and single-type Carried Cargo rules apply.

## Tech progression and launch

The Tech tree has five ordered Tiers with 1, 3, 5, 7, and 2 buildings. Every building required by the current Tier must be completed before the next Tier is revealed. Tier construction durations are 8, 16, 32, 64, and 128 Ticks before crew reduction. Tier 5 contains the Launchpad and Rocket construction targets.

Launchpad and Rocket BUILD use the normal Construction Crew rules and validate all required technology and construction resources at start. Completing both targets does not automatically launch. A separate one-Tick LAUNCH action checks both targets and consumes 30 Rocket Fuel from the selected Storage. A valid attempt succeeds after one Tick and ends the Episode. An attempt without all conditions does not succeed, and the Episode continues until a later valid attempt or the 2,400-Tick limit.

## Communication, Memory, and Reflection

Communication, Memory, and Reflection currently exist only as recorded experiment settings exposed at the observation boundary. The oracle smoke-test controller and deterministic resolver do not exchange messages, retrieve episodic Memory, or generate Reflection summaries.

## Reproducibility and failure handling

The baseline Agent Population is five because local inference capacity is a practical constraint, and experiments may select between one and five Agents. World Seed controls only repeatable Resource Node placement. Agent Seed independently controls Persona generation under the Run Configuration's Persona Mode and future Agent-specific randomness; rerolling Persona changes Agent Seed. The Run ID, Config Version, and full Run Configuration are recorded, while model, backend, prompt, and decoding metadata belong to the future local-LLM integration.

The default `oracle-smoke-controller` may inspect full World state to drive deterministic smoke tests. It is a debug fixture, not a partial-observation research baseline. Future LLM and research controllers must decide from Agent observations and respect the observation boundary. The current oracle controller produces in-process intents and has no model-output retry path; retry, timeout, and malformed model-output handling belong to the future local-LLM controller adapter.

The Episode Recorder currently records the Run Configuration, decision observations, controller identity, submitted intents, resolved actions, status transitions, and outcome outside React World state. Raw model output, latency, token usage, Memory, Reflection, and message metadata remain future optional fields.

## Research boundary and evaluation

The primary purpose is a reproducible research platform. Rocket Launch is the standard Episode task goal, not the only success measure. Outcomes include launch success, launch day, elapsed Ticks, resource and time efficiency, idle or repeated actions, communication activity and downstream effects, role differentiation, and variation across seeds.

Role differentiation is measured from Agent-level action distributions, resource contribution, and time allocation rather than Persona labels. Communication usefulness is not asserted by the engine; it is evaluated afterward by relating messages to subsequent information gain, action changes, and task outcomes.

The first end-to-end scenario is a mostly linear chain from Survival and Raw Resources through Processed Resources and Components to the Launchpad and Rocket. The first experiment runs full-system smoke tests, then staged ablations, then a 2⁴ factorial over Persona, Memory, Reflection, and Communication. Development uses one to three seeds. Research comparisons target at least 20 fixed episodes per condition and report success rate, central tendency, and variance. The baseline Agent Population remains five while smaller populations can be selected as an experimental condition.

## Configuration baseline

The canonical 1/3/5/7/2 building roster, production recipes, Tech Frontier contents, action durations, launch requirement, and 32×32 map are versioned configuration. Benchmark-affecting changes require an explicit configuration version update.
