import { EXPERIMENT_LIMITS } from '../../config/simulation.ts'
import { cn } from '../../lib/cn.ts'
import { Button } from '../ui/Button.tsx'
import { SectionHeader } from '../ui/SectionHeader.tsx'

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex min-h-11 items-center justify-between gap-3 px-4 py-2.5">
      <span className="text-base font-medium text-neutral-700 sm:text-sm">{label}</span>
      <span className="flex shrink-0 items-center gap-2">
        <span className="text-sm tabular-nums text-neutral-500">{checked ? 'ON' : 'OFF'}</span>
        <span className="relative">
          <input className="peer sr-only" type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
          <span className="block h-6 w-11 rounded-full bg-neutral-200 ring-1 ring-neutral-950/10 peer-checked:bg-neutral-950 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-neutral-700" aria-hidden="true" />
          <span className="absolute top-1 left-1 size-4 rounded-full bg-white shadow-sm peer-checked:translate-x-5" aria-hidden="true" />
        </span>
      </span>
    </label>
  )
}

function NumericField({ label, value, limits, disabled = false, onChange }) {
  return (
    <label className={cn('grid min-w-0 gap-1.5', disabled && 'opacity-40')}>
      <span className="text-sm font-medium text-neutral-600">{label}</span>
      <input
        className="min-h-11 min-w-0 rounded-md bg-neutral-100 px-3 text-base tabular-nums text-neutral-950 ring-1 ring-neutral-950/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-700 disabled:cursor-not-allowed sm:min-h-9 sm:text-sm"
        type="number"
        min={limits.min}
        max={limits.max}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

export function ExperimentSettingsPanel({ className = '', config, activeConfig, dirty, runId, onChange, onStart }) {
  return (
    <section className={cn(className)}>
      <SectionHeader title="Experiment settings" meta={dirty ? 'DRAFT' : 'ACTIVE'} />
      <div className="grid grid-cols-3 gap-3 border-b border-neutral-950/10 p-4">
        <NumericField
          label="World Seed"
          value={config.experiment.worldSeed}
          limits={EXPERIMENT_LIMITS.worldSeed}
          onChange={(value) => onChange('experiment', 'worldSeed', value)}
        />
        <NumericField
          label="Agent Seed"
          value={config.experiment.agentSeed}
          limits={EXPERIMENT_LIMITS.agentSeed}
          onChange={(value) => onChange('experiment', 'agentSeed', value)}
        />
        <NumericField
          label="Agent Count"
          value={config.experiment.agentCount}
          limits={EXPERIMENT_LIMITS.agentCount}
          onChange={(value) => onChange('experiment', 'agentCount', value)}
        />
        <NumericField
          label="FOV Radius"
          value={config.observation.fovRadius}
          limits={EXPERIMENT_LIMITS.fovRadius}
          disabled={!config.observation.partialObservation}
          onChange={(value) => onChange('observation', 'fovRadius', value)}
        />
      </div>
      <div className="divide-y divide-neutral-950/10">
        <Toggle label="Memory" checked={config.memory.enabled} onChange={(value) => onChange('memory', 'enabled', value)} />
        <Toggle label="Communication" checked={config.communication.enabled} onChange={(value) => onChange('communication', 'enabled', value)} />
        <Toggle label="Reflection" checked={config.reflection.enabled} onChange={(value) => onChange('reflection', 'enabled', value)} />
        <Toggle label="Partial Observation" checked={config.observation.partialObservation} onChange={(value) => onChange('observation', 'partialObservation', value)} />
        <Toggle label="Storage Timestamp" checked={config.observation.storageTimestamp} onChange={(value) => onChange('observation', 'storageTimestamp', value)} />
      </div>
      <div className="grid gap-2 border-t border-neutral-950/10 p-4">
        <p className="truncate text-sm tabular-nums text-neutral-500">
          RUN {runId.slice(0, 8)} · W{activeConfig.experiment.worldSeed} / A{activeConfig.experiment.agentSeed} · {activeConfig.experiment.agentCount} AGENTS
        </p>
        <Button primary className="w-full" onClick={onStart}>새 실행 시작</Button>
      </div>
    </section>
  )
}
