import { RESOURCE_CONFIG } from '../../config/simulation.js'
import { TRAIT_LABELS } from '../../config/ui.js'
import { cn } from '../../lib/cn.js'
import { Button } from '../ui/Button.jsx'
import { SectionHeader } from '../ui/SectionHeader.jsx'
import { Select } from '../ui/Select.jsx'

export function AgentPanel({ className, world, selectedAgentId, onSelectAgent, onPersonaMode, onReroll }) {
  const selected = world.agents.find((agent) => agent.id === selectedAgentId)

  return (
    <section className={cn(className)}>
      <SectionHeader title="Agents" meta={`${world.agents.length} ACTIVE`} />
      <div className="grid grid-cols-[1fr_auto] gap-2 border-b border-neutral-950/10 p-3">
        <Select aria-label="페르소나 생성 방식" value={world.personaMode} onChange={(event) => onPersonaMode(event.target.value)}>
          <option value="random">Random</option>
          <option value="neutral">Neutral</option>
          <option value="homogeneous">Homogeneous</option>
          <option value="diverse">Diverse</option>
        </Select>
        <Button onClick={onReroll}>Seed +</Button>
      </div>
      <div>
        {world.agents.map((agent) => {
          const isSelected = agent.id === selectedAgentId
          return (
            <button
              key={agent.id}
              type="button"
              className={cn(
                'grid min-h-14 w-full grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-neutral-950/10 px-4 text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-neutral-950 sm:min-h-12',
                isSelected ? 'bg-neutral-100' : 'bg-white hover:bg-neutral-50',
              )}
              aria-pressed={isSelected}
              onClick={() => onSelectAgent(agent.id)}
            >
              <span className={cn('grid size-8 place-items-center rounded-md border text-sm font-semibold', isSelected ? 'border-neutral-950 bg-neutral-950 text-white' : 'border-neutral-950/20 bg-white text-neutral-800')}>{agent.name}</span>
              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  <span className="text-base font-medium sm:text-sm">Agent {agent.name}</span>
                  {agent.cargo.amount > 0 && <span className="text-sm tabular-nums text-neutral-500">{RESOURCE_CONFIG[agent.cargo.type].code} {agent.cargo.amount}</span>}
                </span>
                <span className="truncate text-sm text-neutral-500">{agent.action.detail}</span>
              </span>
              <span className="text-sm font-medium text-neutral-600">{agent.action.type}</span>
            </button>
          )
        })}
      </div>
      <div className="grid gap-3 bg-neutral-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold sm:text-sm">Agent {selected.name} persona</h3>
          <p className="text-sm tabular-nums text-neutral-500">SEED {world.agentSeed}</p>
        </div>
        <div className="grid gap-2">
          {Object.entries(selected.persona).map(([trait, score]) => (
            <div key={trait} className="grid grid-cols-[3rem_minmax(0,1fr)_1.5rem] items-center gap-2 text-sm text-neutral-600">
              <span>{TRAIT_LABELS[trait]}</span>
              <span className="h-1.5 overflow-hidden rounded-full bg-neutral-200">
                <span className="h-full rounded-full bg-neutral-800" style={{ width: `${score * 10}%` }} />
              </span>
              <span className="text-right tabular-nums font-medium text-neutral-800">{score}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
