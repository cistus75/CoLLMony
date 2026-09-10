import { SIMULATION_CONFIG } from '../config/simulation.js'
import { cn } from '../lib/cn.js'

export function AppHeader({ world, running, className }) {
  const day = Math.floor(world.tick / SIMULATION_CONFIG.ticksPerDay) + 1
  const hour = world.tick % SIMULATION_CONFIG.ticksPerDay
  const status = world.status === 'RUNNING' ? (running ? 'RUNNING' : 'PAUSED') : world.status

  return (
    <header className={cn('border-b border-neutral-950/10 bg-white', className)}>
      <div className="mx-auto flex max-w-400 flex-col gap-4 p-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex min-w-0 items-center gap-4">
          <a href="/" className="shrink-0 text-xl font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-950" aria-label="Homepage">CoLLMony</a>
          <span className="h-5 w-px bg-neutral-950/10" aria-hidden="true" />
          <div className="min-w-0">
            <p className="truncate text-base font-medium sm:text-sm">Multi-agent cooperation simulation</p>
            <p className="text-sm tabular-nums text-neutral-500">WORLD SEED {world.worldSeed}</p>
          </div>
        </div>
        <div className="flex min-w-0 items-center gap-5 overflow-x-auto pb-1 lg:pb-0">
          <div className="shrink-0">
            <p className="text-sm text-neutral-500">상태</p>
            <p className="text-base tabular-nums font-semibold sm:text-sm">{status}</p>
          </div>
          <div className="shrink-0 border-l border-neutral-950/10 pl-5">
            <p className="text-sm text-neutral-500">세계 시간</p>
            <p className="text-base tabular-nums font-semibold sm:text-sm">DAY {String(day).padStart(2, '0')} · {String(hour).padStart(2, '0')}:00</p>
          </div>
          <div className="shrink-0 border-l border-neutral-950/10 pl-5">
            <p className="text-sm text-neutral-500">Tick</p>
            <p className="text-base tabular-nums font-semibold sm:text-sm">{String(world.tick).padStart(4, '0')} / {SIMULATION_CONFIG.maxTicks}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
