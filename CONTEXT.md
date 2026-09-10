# CoLLMony

CoLLMony is a research simulation for studying long-horizon cooperation among multiple locally hosted LLM agents. The deterministic simulation owns the world and its consequences; agents choose high-level actions using their own observations, knowledge, persona, memory, and communication.

The primary purpose is a reproducible research platform. Completing the Spaceport and launching the spacecraft is the standard episode task goal used to test cooperative performance, not the product's sole definition of success.

## Core concepts

**World**:
The shared simulated environment in which resources, locations, buildings, technology, time, and launch progress exist.

**Camp**:
The shared starting structure around which all Agents begin an Episode. Each Agent starts within one cell of the Camp, including diagonal cells. Initially it also functions as a shared warehouse: gathered resources must be brought to the Camp before other Agents can use them. As technology progresses, its special starting-location significance decreases while the resource-transfer boundary remains explicit.

**Camp Storage**:
The shared pool of resources deposited at the Camp and made available to other Agents and eligible World actions.

**Storage**:
A resource-holding location such as Camp or a later Warehouse. Each Storage has an independent resource pool; resources are not automatically shared between Storage locations.

**Resource Delivery**:
The act of bringing gathered resources to a Storage location so that they become available from that Storage. Entering one of Camp's four cardinally adjacent cells triggers automatic storage after one Tick; no explicit DEPOSIT action is required.

Resource Delivery uses the same rule for Camp and every later Warehouse.

**Carried Cargo**:
The resource state held by an Agent while transporting gathered material. An Agent may carry an unlimited quantity of one resource type at a time, but cannot carry multiple resource types simultaneously.

**Food and Water Needs**:
Per-Agent daily upkeep requirements of one Food and one Water. If the requirement cannot be paid, the corresponding need becomes negative and imposes a duration penalty rather than causing death.

**Need Deficit**:
The negative Food or Water value after an unpaid daily upkeep requirement. If either need is negative, the more negative of Food and Water determines the multiplier: a deficit of -1 makes every action take twice its base duration, -2 makes every action take three times its base duration, and so on without an upper limit.

**Agent**:
An individual decision-making participant that acts from a partial view of the World and has its own persona, knowledge, memory, and communication history.

**Partial Observation**:
The information about the World that is available to one Agent at a particular simulation step.

**High-level Action**:
An agent-selected intent such as movement, gathering, processing, building, communication, or waiting; the deterministic simulation resolves its legality and consequences.

**Action Duration**:
The number of Ticks required for an action to complete. Standard resource gathering takes two Ticks; mineral gathering takes four Ticks; TALK and WAIT take one Tick. PROCESS and BUILD durations are configuration values.

Each completed GATHER produces exactly one unit of its resource type after the full Action Duration. Gathering does not produce partial units.

**Resource Node**:
An inexhaustible, fixed-position source of a resource. Every resource type has at least one Resource Node in the World. Gathering does not consume a finite deposit; it consumes the required Action Duration.

**Opportunity Cost**:
The time and alternative progress lost when an Agent commits to, interrupts, or abandons an action.

**Work Commitment**:
An ongoing multi-Tick action that continues automatically until completion or explicit abandonment. Leaving the work location ends the commitment and records the remaining time as Opportunity Cost.

**Work Position**:
The orthogonally adjacent cell from which an Agent performs work on a Resource Node, building, or other target. Agents do not stand on the target cell while working.

**Construction Crew**:
The set of Agents simultaneously working on one building from its four adjacent cells. A building can have at most four crew members, and construction duration decreases as crew members join.

**Tech Frontier**:
The next technology or recipe revealed to the Agents after the current technology or recipe is completed. The full dependency graph is not initially disclosed.

**Tech Tier**:
One of five ordered technology levels. Every building required by a Tier must be completed before the next Tier becomes available. The Tiers contain 1, 3, 5, 7, and 1 buildings respectively. Tier construction durations start at eight Ticks and double by Tier: 8, 16, 32, 64, and 128 Ticks. Tier 5 contains only the Spaceport/spacecraft construction target.

**Launch**:
The final one-Tick action performed after Spaceport completion. Launch is a distinct terminal action rather than an automatic consequence of construction.

**Simulation Day**:
A unit of simulated time containing exactly 24 ticks. Each tick represents one simulated hour.

**Tick**:
The atomic decision interval of the simulation, representing one simulated hour. Every Agent makes exactly one decision per Tick.

**Episode**:
A single reproducible run of the World from an initial seed until launch, failure, or the time limit.

**Research Outcome**:
A measurement of an Episode that includes launch success and time, efficiency, repeated or idle behavior, communication, role differentiation, and variation across seeds.

## Research variables

**Persona**:
The stable behavioral identity that differentiates Agents through action preferences such as risk tolerance, time preference, cooperation tendency, and role preference. Persona does not restrict an Agent's action space or underlying capability.

**Memory**:
An Agent's retained experience from prior simulation events that can influence later decisions.

**Reflection**:
An Agent's deliberate interpretation of experience that transforms events or memories into reusable guidance.

**Communication**:
Information exchanged between Agents through an explicit in-world or agent-level interaction.

Communication is private to an explicitly selected recipient and is available only within a four-cell spatial range.

Messages are free-form and are not automatically verified as truthful by the World.

**World Seed**:
The deterministic seed that defines the initial World scenario and its variation.

**Agent Seed**:
The deterministic seed that defines Agent-specific persona generation and other Agent-level variation independently of the World.

## Confirmed boundaries

An Episode lasts at most 100 Simulation Days, or 2,400 Ticks. All Agents choose actions from the same Tick observation before the deterministic simulation resolves those actions. Resolution uses a seed-based deterministic tie-break for conflicts that exist; Resource Nodes themselves are inexhaustible, so gathering does not compete for finite quantities. A multi-Tick Work Commitment continues until completion or explicit abandonment. Leaving its work location ends the commitment and records the lost time as Opportunity Cost. The World separates actual state from each Agent's knowledge, and Agent knowledge is built from information the Agent has observed or received. Memory stores experience; Reflection generalizes experience into guidance and is treated as a distinct process. Persona remains fixed during an Episode while reflection may change beliefs and strategy. Action legality is validated by the deterministic engine and invalid actions are not silently repaired.

The initial World has no obstacle or line-of-sight system. Agents use the same fixed Manhattan observation range, and TALK succeeds only when sender and recipient are within four cells at resolution; a successful message appears in the recipient's next-Tick observation.

All spatial work requires the Agent to occupy one of the target's four orthogonally adjacent cells. A resource node or building is never occupied by the working Agent. Construction duration with multiple Agents is rounded up to the next whole Tick, with a minimum of one Tick. Multi-Agent duration reduction applies to BUILD only; GATHER and PROCESS remain individual work.

Gathered resources are initially held as Carried Cargo by the gathering Agent and are not usable by other Agents or World actions until delivered to a Storage. An Agent can carry unlimited quantity but only one resource type at a time.

An Agent must deliver its current Carried Cargo before switching to a different resource type. There is no initial discard action.

Camp Storage remains available throughout an Episode. Technology progression may unlock additional Warehouse locations, which can be placed more strategically, but each Warehouse maintains an independent resource pool with no automatic sharing with Camp or other Warehouses. Every Storage uses the same four-cardinal-adjacent-cell, one-Tick automatic delivery rule. PROCESS and BUILD require their inputs to be present in the relevant Storage; carried resources cannot be consumed directly. A single PROCESS or BUILD action must source all required inputs from one Storage; resources in multiple Storage pools cannot be automatically combined. Once Warehouses exist, Food and Water upkeep may be paid from any Storage even though ordinary resource consumption remains local to the selected Storage.

PROCESS consumes all inputs at start and places one configured output unit in the same Storage at completion. BUILD consumes or reserves all required inputs at start. A completed GATHER must finish before its one-unit output is added to Carried Cargo; partial work produces no resource. After completion, another GATHER must be explicitly selected rather than repeating automatically.

The initial end-to-end scenario uses a small mostly linear chain from basic resources through processed resources and intermediate buildings to advanced technology and Spaceport. Branching recipes and alternative paths are later extensions.

Each Agent consumes one Food and one Water per Simulation Day. The initial Camp Storage contains 25 Food and 25 Water, representing five days of upkeep for five Agents. Failure to pay upkeep does not kill an Agent; it increases the duration multiplier for that Agent's subsequent actions according to the more negative of its Food and Water Need Deficits. The deficit accumulates without an upper bound while the corresponding upkeep remains unpaid. Once Warehouses exist, upkeep can consume Food and Water from the global total across all Storage locations. Each need recovers independently by one per successfully paid daily upkeep.

Upkeep Storage selection uses ascending Storage ID order. If one need is present in multiple Storage locations, the resolver consumes from the lowest-ID Storage first.

Spaceport is built using the normal Construction Crew rules after all build-time tech and resource preconditions are satisfied. Once complete, a separate one-Tick LAUNCH action checks Spaceport completion and launch fuel. Launch requires exactly 100 Coal in the relevant Storage; Coke cannot substitute for Coal. A valid launch succeeds immediately; an attempted launch without all conditions does not succeed, and the Episode continues until a later successful attempt or the 2,400-Tick limit. A successful launch ends the Episode.

Multiple Agents may gather simultaneously from the same Resource Node. The node is inexhaustible, and each gathering action is an independent personal Work Commitment.

The initial experiment fixes the Agent population at five because local inference capacity is a practical constraint. All five Agents start within one cell of the Camp; diagonal cells are allowed. Deterministic decoding settings and seeds are fixed for the reproducibility baseline, and model, backend, prompt, and version metadata are logged.

The initial decision interface provides one action intent per Agent per Tick. Long action queues are out of scope for the initial system because they increase context complexity; longer-term behavior is expressed through the current context, Memory, and Reflection.

The exact duration table for PROCESS and BUILD must be reconstructed before implementation. The duration table is configuration, not an implicit model assumption. TALK and WAIT each consume one Tick. A completed action is the only point at which its resource reward is granted; abandoning work grants no partial reward.

Construction may use up to four simultaneous Agents, one per orthogonally adjacent Work Position. Crew participation reduces the configured construction duration in proportion to the number of participating Agents; fractional Tick durations are rounded up, with a minimum of one Tick.

After a technology or recipe is completed, the next Tech Frontier is revealed. The full technology dependency graph is not initially shown. Initial Memory is empty, and Agents receive only the common starting knowledge plus their distinct persona. Reflection runs at the end of each Simulation Day. Malformed or timed-out model output receives a bounded retry and then a logged WAIT/no-op fallback.
