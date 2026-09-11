# CoLLMony

CoLLMony is a research simulation for studying long-horizon cooperation among multiple locally hosted LLM agents. The deterministic simulation owns the world and its consequences; agents choose high-level actions using their own observations, knowledge, persona, memory, and communication.

The primary purpose is a reproducible research platform. Completing the Launchpad and Rocket, then launching the Rocket, is the standard episode task goal used to test cooperative performance, not the product's sole definition of success.

## Core concepts

**World**:
The fixed 32×32-cell simulated environment in which resources, locations, buildings, technology, time, and launch progress exist.

**Camp**:
The shared starting structure fixed at the center of the World, around which all Agents begin an Episode. Each Agent starts within one cell of the Camp, including diagonal cells. Initially it also functions as a shared warehouse: gathered resources must be brought to the Camp before other Agents can use them.

**Camp Storage**:
The shared pool of resources deposited at the Camp and made available to other Agents and eligible World actions.

**Storage**:
A resource-holding location such as Camp or a later Warehouse. Each Storage has an independent resource pool; resources are not automatically shared between Storage locations.

**Resource Delivery**:
The explicit one-Tick DELIVER action performed from a Storage's Work Position to make Carried Cargo available at that Storage. Reaching the Work Position alone does not transfer resources, and there is no separate DEPOSIT action.

Resource Delivery uses the same rule for Camp and every later Warehouse.

**Carried Cargo**:
The resource state held by an Agent while transporting gathered material. An Agent may carry at most three units of one resource type and cannot mix resource types.

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
The number of Ticks required for an action to complete. Standard resource gathering takes two Ticks; mineral gathering takes four Ticks; WAIT takes one Tick. PROCESS and BUILD durations are configuration values.

Each completed GATHER produces exactly one unit of its resource type after the full Action Duration. Gathering does not produce partial units.

**Resource Node**:
An inexhaustible source of a gatherable resource whose legal position is generated from the World Seed when an Episode begins and remains fixed for that Episode. Every Survival Resource and Raw Resource has one configured Resource Node type.

**Building Blueprint**:
Shared non-spatial knowledge describing a Building's identity, Tier, footprint size, construction inputs, and capability. A Blueprint has no World position.

**Construction Site**:
The fixed physical location created when the first valid BUILD intent places a revealed Building Blueprint. Its position is the top-left cell of the Building footprint, and the intent's selected Storage is fixed to the site. Neither can be changed by later BUILD intents.

**Survival Resource**:
Food or Water consumed by daily Agent upkeep. It is gathered directly from a Resource Node.

**Raw Resource**:
A material gathered directly from a Resource Node and used in construction or a Production Recipe.

**Processed Resource**:
A material produced from Raw Resources through a Production Recipe after its required production building is complete.

**Component**:
A higher-order manufactured resource produced from Raw or Processed Resources and used in advanced buildings or the Rocket.

**Production Recipe**:
A configured transformation that consumes input resources and produces one output resource at a required production building.

**Opportunity Cost**:
The time and alternative progress lost when an Agent commits to, interrupts, or abandons an action.

**Work Commitment**:
An ongoing personal GATHER or PROCESS action that continues until completion or explicit abandonment. BUILD uses repeated per-Tick Construction Crew participation instead.

**Work Position**:
The orthogonally adjacent cell from which an Agent performs work on a Resource Node, building, or other target. Agents do not stand on the target cell while working.

**Construction Crew**:
The set of Agents simultaneously working on one building from its four adjacent cells. A building can have at most four crew members, and construction duration decreases as crew members join.

**Tech Frontier**:
The globally shared, non-spatial knowledge of currently revealed Building Blueprints, completed technology, and Production Recipes made available by completed buildings. Physical locations and building state still follow Partial Observation, and the full future dependency graph is not disclosed.

**Tech Tier**:
One of five ordered technology levels. Every building required by a Tier must be completed before the next Tier becomes available. The Tiers contain 1, 3, 5, 7, and 2 buildings respectively. Tier construction durations start at eight Ticks and double by Tier: 8, 16, 32, 64, and 128 Ticks. Tier 5 contains the Launchpad and Rocket construction targets.

**Launchpad**:
The Tier 5 building from which the completed Rocket is launched. It is a separate construction target from the Rocket.

**Rocket**:
The Tier 5 vehicle assembled from advanced Components. It must be complete and fueled before Launch.

**Launch**:
The final one-Tick action performed after both the Launchpad and Rocket are complete and 30 Rocket Fuel is available in the selected Storage. Launch consumes that fuel and is a distinct terminal action rather than an automatic consequence of construction.

**Simulation Day**:
A unit of simulated time containing exactly 24 ticks. Each tick represents one simulated hour.

**Tick**:
The atomic World resolution interval representing one simulated hour. An Agent requests a new decision only when deterministic ongoing work does not already determine its next action.

**Episode**:
A single reproducible run of the World from one immutable Run Configuration until launch, failure, or the time limit.

**Run Configuration**:
The immutable experiment conditions captured when an Episode starts, including Config Version, World Seed, Agent Seed, Agent Population, Persona Mode, feature switches, and Observation Policy. Editing a draft configuration does not alter an active Episode.

**Config Version**:
The integer identifying benchmark-affecting simulation rule and configuration changes. The initial version is `1`.

**Run ID**:
The unique identity attached to one Episode and its recorded Run Configuration.

**Agent Population**:
The number of Agents participating in an Episode. The baseline is five and an experiment may select between one and five.

**Observation Policy**:
The Run Configuration that selects full or partial World visibility, the partial-observation field radius, and whether observed Storage state carries an observation time.

**World Seed**:
The deterministic seed used only to generate Resource Node positions. It does not change World dimensions, Camp position, Building positions, or Agent Persona.

**Agent Seed**:
The deterministic seed for repeatable Agent-specific variation, including Persona generation under the selected Persona Mode. Rerolling Persona changes this seed.

**Persona Mode**:
The Run Configuration setting that selects the Persona generation strategy. It remains fixed for an active Episode.

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

Communication is a planned research capability; the current oracle smoke-test controller and deterministic resolver do not implement message exchange.

## Confirmed boundaries

An Episode lasts at most 100 Simulation Days, or 2,400 Ticks. The World advances every Tick. Agents whose current controller flow requires a new decision receive observations from the same unresolved Tick before the deterministic simulation resolves submitted and automatic continuation actions. Deterministic ongoing work can continue without a new Controller or LLM inference. Exclusive claims use an Agent Seed-based deterministic tie-break while non-conflicting actions retain their normal order; Resource Nodes themselves are inexhaustible, so gathering does not compete for finite quantities. A multi-Tick Work Commitment continues until completion or explicit abandonment. Leaving its work location ends the commitment and records the lost time as Opportunity Cost. The World separates actual state from each Agent observation. Persona remains fixed during an Episode. Action legality is validated by the deterministic engine and invalid actions are not silently repaired.

The initial World has no obstacle or line-of-sight system. Partial Observation uses the Run Configuration's Manhattan field radius; disabling it exposes the full World projection. The Communication setting is recorded but has no resolver behavior until message exchange is implemented.

All spatial work requires the Agent to occupy one of the target's four orthogonally adjacent cells. A resource node or building is never occupied by the working Agent. Construction duration with multiple Agents is rounded up to the next whole Tick, with a minimum of one Tick. Multi-Agent duration reduction applies to BUILD only; GATHER and PROCESS remain individual work.

Agents do not block movement and may occupy the same grid cell. Static World entities remain blocking.

Gathered resources are initially held as Carried Cargo by the gathering Agent and are not usable by other Agents or World actions until delivered to a Storage. An Agent can carry a configured batch of three units of one resource type at a time.

An Agent must deliver its current Carried Cargo before switching to a different resource type. There is no initial discard action.

Camp Storage remains available throughout an Episode. Technology progression may unlock additional Warehouse locations, which can be placed more strategically, but each Warehouse maintains an independent resource pool with no automatic sharing with Camp or other Warehouses. Every Storage uses the same explicit one-Tick DELIVER rule from a Work Position. PROCESS and BUILD require their inputs to be present in the relevant Storage; carried resources cannot be consumed directly. The first BUILD for a site explicitly selects one existing Storage with all required inputs, and that selection remains fixed for the site. An invalid or understocked selection is rejected rather than replaced with another Storage. A single PROCESS or BUILD action must source all required inputs from one Storage; resources in multiple Storage pools cannot be automatically combined. Once Warehouses exist, Food and Water upkeep may be paid from any Storage even though ordinary resource consumption remains local to the selected Storage.

PROCESS consumes all inputs at start and places one configured output unit in the same Storage at completion. BUILD consumes or reserves all required inputs at start. A completed GATHER must finish before its one-unit output is added to Carried Cargo; partial work produces no resource. After completion, another GATHER must be explicitly selected rather than repeating automatically.

The initial end-to-end scenario uses a mostly linear chain from Survival and Raw Resources through Processed Resources and Components to the Launchpad and Rocket. Branching recipes and alternative paths are later extensions.

Each Agent consumes one Food and one Water per Simulation Day. The initial Camp Storage contains 25 Food and 25 Water, representing five days of upkeep for five Agents. Failure to pay upkeep does not kill an Agent; it increases the duration multiplier for that Agent's subsequent actions according to the more negative of its Food and Water Need Deficits. The deficit accumulates without an upper bound while the corresponding upkeep remains unpaid. Once Warehouses exist, upkeep can consume Food and Water from the global total across all Storage locations. Each need recovers independently by one per successfully paid daily upkeep.

Upkeep Storage selection uses ascending Storage ID order. If one need is present in multiple Storage locations, the resolver consumes from the lowest-ID Storage first.

The Launchpad and Rocket are built as separate Tier 5 targets using the normal Construction Crew rules after all build-time technology and resource preconditions are satisfied. Once both are complete, a separate one-Tick LAUNCH action checks both targets and consumes 30 Rocket Fuel from the selected Storage. A valid launch succeeds after one Tick; an attempted launch without all conditions does not succeed, and the Episode continues until a later successful attempt or the 2,400-Tick limit. A successful launch ends the Episode.

Multiple Agents may gather simultaneously from the same Resource Node. The node is inexhaustible, and each gathering action is an independent personal Work Commitment.

The baseline Agent Population is five because local inference capacity is a practical constraint, while an Episode may run with one to five Agents. Every participating Agent starts within one cell of the Camp; diagonal cells are allowed. World Seed and Agent Seed default to one, Config Version starts at one, and the Run ID and full Run Configuration are logged. Model, backend, prompt, and decoding metadata belong to the future local-LLM integration.

The initial decision interface provides one action intent only when an Agent needs a new decision. GATHER and PROCESS commitments and active BUILD crew participation can continue through deterministic per-Tick actions without a fresh inference. When the controller flow requests a new choice, leaving BUILD records an observable construction abandonment without preserving personal partial progress. Long action queues are out of scope for the initial system.

The baseline PROCESS and BUILD duration table is configuration, not an implicit model assumption. WAIT consumes one Tick. A completed action is the only point at which its resource reward is granted; abandoning work grants no partial reward.

Construction may use up to four simultaneous Agents, one per orthogonally adjacent Work Position. Crew participation reduces the configured construction duration in proportion to the number of participating Agents; fractional Tick durations are rounded up, with a minimum of one Tick.

After the current Tier is completed, the next Tech Frontier is revealed. Agents globally know its Building Blueprints and know recipes enabled by completed production buildings, while physical observations remain subject to FOV. The full future technology dependency graph is not initially shown. Memory retrieval, Reflection generation, Communication, and model-output retry behavior remain future controller integrations.
