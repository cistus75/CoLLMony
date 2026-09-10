# CoLLMony domain and system design decisions

CoLLMony is a deterministic research simulation for studying long-horizon cooperation among five locally hosted LLM Agents. The World engine owns state, legality, timing, resource accounting, technology progression, and outcomes. Agents receive partial observations and select high-level actions. This document preserves the agreed domain definitions and MVP rules in one place.

## Domain definitions

**World** is the shared 32×32 simulated environment containing locations, Resource Nodes, buildings, technology, Storage, time, and launch progress.

**Agent** is an individual decision-maker with its own Persona, Partial Observation, Knowledge, Memory, Reflection, carried cargo, needs, and communication history.

**Tick** is one simulated hour. Every Agent makes exactly one decision per Tick. A Simulation Day is 24 Ticks, and an Episode lasts at most 100 Simulation Days, or 2,400 Ticks.

**Episode** is one reproducible World run from its initial seed until successful Launch or the 2,400-Tick limit.

**Partial Observation** is the Agent-specific projection of the World available at a decision point. It is not the raw global World state.

**Knowledge** is what an Agent has learned from direct observation or Communication. Observed facts, received facts, inferences, beliefs, and actual World state are distinct. Information can be stale or wrong.

**High-level Action** is an Agent-selected intent such as MOVE, GATHER, PROCESS, BUILD, TALK, WAIT, CONTINUE, ABANDON, or LAUNCH. The deterministic World validates and resolves the intent.

**Persona** is a stable behavioral identity that changes preferences such as risk appetite, exploration tendency, cooperation tendency, time preference, and priorities. Persona does not restrict action space or hard capabilities and remains fixed during an Episode. Explicit professions are not assigned; role differentiation is an observed behavioral outcome.

**Memory** is an Agent's fixed-size, retrievable record of prior experience. The research raw log is separate and retains the complete event history.

**Reflection** is a distinct process that generalizes experience into structured `belief`, `lesson`, or `strategy` guidance. Reflection may change beliefs and strategy, but not Persona or actual World state.

**Communication** is an explicit private message exchanged between Agents. TALK selects one recipient, requires the sender and recipient to be within four cells at resolution, and makes a successful message visible in the recipient's next-Tick observation.

**Resource Node** is a fixed-position, inexhaustible source. Every resource type has at least one Resource Node in the World. Quantity does not deplete; gathering consumes time.

**Work Position** is one of the four orthogonally adjacent cells from which an Agent performs work on a Resource Node, building, or other target. Agents never stand on target tiles while working.

**Work Commitment** is an ongoing multi-Tick action that continues until completion or explicit abandonment. Leaving the Work Position ends the commitment and records the remaining time as Opportunity Cost.

**Opportunity Cost** is the time and alternative progress lost by committing to, interrupting, or abandoning an action.

**Construction Crew** is the set of Agents simultaneously working on one building, with at most one Agent on each of its four orthogonally adjacent Work Positions.

**Camp** is the shared starting structure. All five Agents start within one cell of Camp, including diagonal cells. Camp is also a permanent Storage location.

**Storage** is a resource-holding location such as Camp or a later Warehouse. Each Storage has an independent resource pool. Resources are not automatically shared between Storage locations.

**Carried Cargo** is the resource state held by an Agent while transporting gathered material. An Agent may carry an unlimited quantity of exactly one resource type at a time.

**Food and Water Needs** are per-Agent daily upkeep requirements of one Food and one Water.

**Need Deficit** is a negative Food or Water value caused by unpaid upkeep. The more negative of the two deficits determines the Agent's duration multiplier.

**Tech Frontier** is the next technology or recipe revealed after the current technology or recipe is completed. The full dependency graph is not initially disclosed.

**Tech Tier** is one of five ordered technology levels. The Tiers contain 1, 3, 5, 7, and 1 buildings respectively. Every building in the current Tier must be complete before the next Tier is revealed.

**Launch** is the final one-Tick action performed after Spaceport completion. It is separate from Spaceport BUILD.

## Clock, decisions, and resolution

All Agents receive their same-Tick observations before any action result is resolved and each chooses exactly once. The deterministic resolver then handles legality, action duration, resource effects, movement, construction, and conflicts. Agents do not receive same-Tick feedback before the next decision.

The initial action durations are:

- MOVE: one Tick for up to four cardinal cells
- ordinary GATHER: two Ticks
- mineral GATHER: four Ticks
- PROCESS: two Ticks initially
- TALK: one Tick
- WAIT: one Tick
- LAUNCH: one Tick
- BUILD: eight Ticks for Tier 1, then 16, 32, 64, and 128 Ticks for Tiers 2–5 before crew reduction

The exact building roster, recipes, and any PROCESS/BUILD exceptions are configuration data and must be versioned before benchmark runs.

Movement is cardinal only; diagonal movement is not allowed. The initial World has no obstacles or line-of-sight system. Movement and spatial action legality are deterministic. Invalid actions are not silently repaired.

For a multi-Tick Work Commitment, the Agent still has a per-Tick decision boundary: it explicitly chooses CONTINUE or ABANDON while the work is in progress. Leaving the Work Position also ends the commitment. Abandoned work yields no partial resource or construction reward.

Construction crew reduction is calculated first as `ceil(base_duration / crew_size)`, with a minimum of one Tick. Crew can join or leave during construction; remaining work is resolved from the current crew. Multi-Agent duration reduction applies to BUILD only. GATHER and PROCESS remain individual work.

Conflict outcomes use a seed-based deterministic tie-break rather than permanently privileging a fixed Agent ID. Resource gathering itself has no finite-resource contention because Resource Nodes are inexhaustible.

## Observation and information boundaries

Observation uses a fixed Manhattan radius of four for every Agent. Within that projection, an Agent can see relevant positions and visible current actions. Other Agents' private Persona, Memory, carried cargo, and private message history are hidden. The Agent receives its observation projection, not raw global World state.

The full map, global resource quantities, full Tech tree, remote Storage quantities, and other Agents' private state are not initially disclosed. An Agent can learn remote facts by direct observation or Communication, and those facts retain source and time so stale beliefs are possible.

The initial common knowledge includes the action schema, basic movement rules, the Agent's own state, and the local observation. After a technology or recipe is completed, the next Tech Frontier is revealed to all Agents, while the complete dependency graph remains hidden.

## Spatial work and resources

All GATHER, PROCESS, and BUILD actions require the Agent to occupy one of the target's four cardinally adjacent cells. A Resource Node or building is never occupied by the working Agent.

Each completed GATHER produces exactly one unit after the full Action Duration. There is no partial output. After completion, another GATHER must be explicitly selected; automatic repeat is not used. Multiple Agents may gather simultaneously from the same Resource Node as independent personal Work Commitments.

An Agent can carry unlimited quantity but only one resource type. The Agent must deliver its current Carried Cargo before switching to another resource type. There is no initial discard action.

## Camp, Warehouse, and logistics

Camp begins as the shared starting Storage and remains available throughout the Episode. Technology progression can unlock additional Warehouses, which are BUILD targets with independent Storage pools and strategically placeable locations. Camp and Warehouses do not automatically share ordinary resources.

Entering one of a Storage's four cardinally adjacent cells triggers automatic Resource Delivery after one Tick. There is no explicit DEPOSIT action. The Agent must remain in the required adjacent position for delivery to complete; leaving cancels the delivery and leaves the cargo with the Agent. The same delivery rule applies to Camp and every Warehouse.

PROCESS consumes all inputs at start from one selected Storage and places its output in that same Storage at completion. BUILD consumes or reserves all required inputs at start from one selected Storage. Carried resources cannot be consumed directly. A single PROCESS or BUILD action cannot combine inputs from multiple Storage pools.

Food and Water upkeep is the exception to independent ordinary Storage pools. Once Warehouses exist, upkeep can use the global total across all Storage locations. When a need is present in multiple Storage locations, the resolver consumes from the lowest Storage ID first.

## Food and Water needs

Each Agent consumes one Food and one Water per Simulation Day. The initial Camp Storage contains 25 Food and 25 Water, covering five days of upkeep for five Agents. Upkeep is processed at the day boundary and does not kill an Agent when unpaid.

If either need is negative, the more negative deficit determines the duration multiplier for every action, including MOVE, GATHER, PROCESS, BUILD, TALK, and WAIT. A deficit of -1 makes an action take twice its base duration, -2 makes it take three times its base duration, -3 makes it take four times its base duration, and so on without an upper limit. The penalty is calculated at action start and remains fixed for that action.

Food and Water deficits accumulate independently without an upper limit while unpaid. Each need recovers independently by one for each successfully paid daily upkeep. Food and Water are ordinary resources for gathering and cargo purposes: each completed gathering action produces one unit, and single-type Carried Cargo rules apply.

## Tech progression and launch

The Tech tree has five ordered Tiers with 1, 3, 5, 7, and 1 buildings. Every building required by the current Tier must be completed before the next Tier is revealed. Tier construction durations are 8, 16, 32, 64, and 128 Ticks before crew reduction. Tier 5 contains only the Spaceport/spacecraft construction target.

Spaceport BUILD uses the normal Construction Crew rules and validates all required technology and construction resources at start. A completed Spaceport does not automatically launch. A separate one-Tick LAUNCH action checks Spaceport completion and launch fuel. Launch requires exactly 100 Coal in the relevant Storage; Coke cannot substitute for Coal. A valid attempt succeeds immediately and ends the Episode. An attempt without all conditions does not succeed, and the Episode continues until a later valid attempt or the 2,400-Tick limit.

## Communication, Memory, and Reflection

TALK is a private free-form message to one explicitly selected Agent within four cells at resolution. A successful message arrives in the recipient's next-Tick observation. The message has a fixed token or character budget, is not automatically verified as truthful, and does not use a global broadcast or shared blackboard. When Communication is disabled for an ablation, TALK is unavailable.

Memory has fixed capacity and deterministic retrieval based on relevance, recency, and importance. Raw research logs remain separate and are not directly searchable by Agents unless information was retained in their Memory. Reflection runs at the end of each Simulation Day and produces searchable `belief`, `lesson`, or `strategy` entries with source event, Tick, confidence, and validity metadata. Reflection does not change Persona or actual World state.

## Reproducibility and failure handling

The initial population is fixed at five because local inference capacity is a practical constraint. World seed and Agent seed are independent. Deterministic decoding settings, model, backend, prompt, and version metadata are recorded. The deterministic baseline fixes decoding settings and seeds.

Malformed JSON, invalid schema output, unknown actions, and timeouts receive at most one retry with the same prompt, model, and decoding seed. If the retry fails, the Tick becomes a logged WAIT/no-op fallback. Normal WAIT, invalid output, retry, and fallback are separate event types. Fallback time counts as idle or efficiency loss.

The raw event log records per-Tick observation hash, raw model output, parsed action, validation result, resolver result, World state diff, Memory/Reflection changes, and model/prompt metadata so episodes can be audited and replayed.

## Research boundary and evaluation

The primary purpose is a reproducible research platform. Spaceport Launch is the standard Episode task goal, not the only success measure. Outcomes include launch success, launch day, elapsed Ticks, resource and time efficiency, idle or repeated actions, communication activity and downstream effects, role differentiation, and variation across seeds.

Role differentiation is measured from Agent-level action distributions, resource contribution, and time allocation rather than Persona labels. Communication usefulness is not asserted by the engine; it is evaluated afterward by relating messages to subsequent information gain, action changes, and task outcomes.

The first end-to-end scenario is a small mostly linear chain from basic resources through processed resources and intermediate buildings to advanced technology and Spaceport. The first experiment runs full-system smoke tests, then staged ablations, then a 2⁴ factorial over Persona, Memory, Reflection, and Communication. Development uses one to three seeds. Research comparisons target at least 20 fixed episodes per condition and report success rate, central tendency, and variance. The first Agent population remains five; population size and World variation are later experimental axes.

## Configuration still to be specified

The architecture and domain rules above are fixed. The remaining configuration work is to name the 1/3/5/7/1 buildings, define recipes and Tech Frontier contents, finalize any recipe-specific PROCESS/BUILD durations, define the exact launch-fuel Storage reference, and publish the canonical 32×32 map before benchmark runs.
