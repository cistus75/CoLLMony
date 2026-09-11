import { PLAYBACK_SPEEDS } from '../../config/ui.ts'
import { cn } from '../../lib/cn.ts'
import { Button } from '../ui/Button.tsx'

export function SimulationToolbar({
  className = '',
  observationMode,
  selectedAgentName,
  running,
  speed,
  onToggleObservation,
  onSpeedChange,
  onStep,
  onToggleRunning,
  onReset,
}) {
  return (
    <div className={cn('flex min-w-0 items-center gap-2 overflow-x-auto pb-1 xl:pb-0', className)} role="group" aria-label="시뮬레이션 제어">
      <Button active={observationMode} aria-pressed={observationMode} onClick={onToggleObservation}>
        {observationMode ? `Agent ${selectedAgentName} 관측` : '전체 시야'}
      </Button>
      <div className="flex shrink-0 rounded-md bg-white p-0.5 ring-1 ring-neutral-950/10" role="radiogroup" aria-label="재생 속도">
        {PLAYBACK_SPEEDS.map((value) => (
          <button
            key={value}
            type="button"
            className={cn(
              'min-h-11 rounded-sm px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-700 sm:min-h-8',
              speed === value ? 'bg-neutral-200 text-neutral-950' : 'text-neutral-500 hover:bg-neutral-100',
            )}
            role="radio"
            aria-checked={speed === value}
            onClick={() => onSpeedChange(value)}
          >
            {value}×
          </button>
        ))}
      </div>
      <Button onClick={onStep}>+1 Tick</Button>
      <Button primary onClick={onToggleRunning}>{running ? 'Pause' : 'Run'}</Button>
      <Button onClick={onReset}>Reset</Button>
    </div>
  )
}
