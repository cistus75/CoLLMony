import { cn } from '../../lib/cn.ts'
import { AgentPanel } from './AgentPanel.tsx'
import { EventPanel } from './EventPanel.tsx'
import { ExperimentSettingsPanel } from './ExperimentSettingsPanel.tsx'
import { FrontierPanel } from './FrontierPanel.tsx'
import { StoragePanel } from './StoragePanel.tsx'

export function Inspector({
  className = '',
  world,
  selectedAgentId,
  frontier,
  completedBuildings,
  onSelectAgent,
  onPersonaMode,
  onReroll,
  experimentConfig,
  experimentDirty,
  onExperimentChange,
  onExperimentStart,
}) {
  return (
    <aside className={cn('min-w-0 overflow-hidden rounded-lg bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.04)] [&>section+section]:border-t-2 [&>section+section]:border-neutral-950/10', className)}>
      <ExperimentSettingsPanel
        config={experimentConfig}
        activeConfig={world.run.config}
        dirty={experimentDirty}
        runId={world.run.id}
        onChange={onExperimentChange}
        onStart={onExperimentStart}
      />
      <AgentPanel
        world={world}
        selectedAgentId={selectedAgentId}
        onSelectAgent={onSelectAgent}
        onPersonaMode={onPersonaMode}
        onReroll={onReroll}
      />
      <StoragePanel storages={world.storages} />
      <FrontierPanel
        world={world}
        frontier={frontier}
        completed={completedBuildings}
        total={world.buildings.length}
      />
      <EventPanel events={world.log} />
    </aside>
  )
}
