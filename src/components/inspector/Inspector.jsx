import { cn } from '../../lib/cn.js'
import { AgentPanel } from './AgentPanel.jsx'
import { EventPanel } from './EventPanel.jsx'
import { FrontierPanel } from './FrontierPanel.jsx'
import { StoragePanel } from './StoragePanel.jsx'

export function Inspector({
  className,
  world,
  selectedAgentId,
  frontier,
  completedBuildings,
  onSelectAgent,
  onPersonaMode,
  onReroll,
}) {
  return (
    <aside className={cn('min-w-0 overflow-hidden rounded-lg bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.04)] [&>section+section]:border-t-2 [&>section+section]:border-neutral-950/10', className)}>
      <AgentPanel
        world={world}
        selectedAgentId={selectedAgentId}
        onSelectAgent={onSelectAgent}
        onPersonaMode={onPersonaMode}
        onReroll={onReroll}
      />
      <StoragePanel storage={world.storage} />
      <FrontierPanel
        frontier={frontier}
        storage={world.storage}
        completed={completedBuildings}
        total={world.buildings.length}
      />
      <EventPanel events={world.log} />
    </aside>
  )
}
