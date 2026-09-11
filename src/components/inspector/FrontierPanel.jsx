import { LAUNCH_CONFIG, RESOURCE_CONFIG } from '../../config/simulation.js'
import { cn } from '../../lib/cn.js'
import { SectionHeader } from '../ui/SectionHeader.jsx'

function ResourceProgress({ inputs, resources }) {
  return (
    <dl className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
      {Object.entries(inputs).map(([resource, amount]) => (
        <div key={resource} className="flex min-w-0 items-center justify-between gap-2">
          <dt className="truncate text-sm font-medium text-neutral-700">{RESOURCE_CONFIG[resource].label}</dt>
          <dd className="text-sm tabular-nums text-neutral-500">{resources[resource]} / {amount}</dd>
        </div>
      ))}
    </dl>
  )
}

function ProgressBar({ value, label }) {
  const percent = Math.round(value * 100)
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-neutral-200" role="progressbar" aria-label={label} aria-valuemin="0" aria-valuemax="100" aria-valuenow={percent}>
      <div className="h-full rounded-full bg-neutral-950 [width:var(--progress)]" style={{ '--progress': `${percent}%` }} />
    </div>
  )
}

function BuildingProgress({ building, storage }) {
  const inputs = Object.entries(building.inputs)
  const inputProgress = inputs.length
    ? inputs.reduce((sum, [resource, amount]) => sum + Math.min(storage.resources[resource] / amount, 1), 0) / inputs.length
    : 1
  const progress = building.status === 'UNDER_CONSTRUCTION'
    ? 1 - (building.workRemaining / building.duration)
    : inputProgress
  const remainingWork = Math.ceil(building.workRemaining * 100) / 100

  return (
    <article className="grid gap-3 px-4 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold">{building.name}</h3>
          <p className="text-sm text-neutral-500">Tier {building.tier} · {building.size.width} × {building.size.height} cells · {storage.name}</p>
        </div>
        <p className="shrink-0 text-sm tabular-nums font-medium text-neutral-700">
          {building.status === 'UNDER_CONSTRUCTION' ? `${remainingWork} WORK` : 'REVEALED'}
        </p>
      </div>
      <ResourceProgress inputs={building.inputs} resources={storage.resources} />
      <ProgressBar value={progress} label={`${building.name} 진행률 ${Math.round(progress * 100)}%`} />
    </article>
  )
}

function LaunchProgress({ world }) {
  const storage = world.storages.find((item) => item.id === world.launch.storageId) ?? world.storages[0]
  const { resource, amount } = LAUNCH_CONFIG.fuel
  const progress = world.launch.status === 'IN_PROGRESS' || world.launch.status === 'COMPLETE'
    ? 1
    : Math.min(storage.resources[resource] / amount, 1)
  const status = {
    LOCKED: 'LOCKED',
    READY: 'FUELING',
    IN_PROGRESS: `${world.launch.remaining} TICK`,
    COMPLETE: 'COMPLETE',
  }[world.launch.status]

  return (
    <article className="grid gap-3 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-base font-semibold">로켓 발사</h3>
          <p className="text-sm text-neutral-500">{storage.name} · 발사대와 로켓 완공 후 1 Tick</p>
        </div>
        <p className="shrink-0 text-sm tabular-nums font-medium text-neutral-700">{status}</p>
      </div>
      <ResourceProgress inputs={{ [resource]: amount }} resources={storage.resources} />
      <ProgressBar value={progress} label={`로켓 발사 준비율 ${Math.round(progress * 100)}%`} />
    </article>
  )
}

export function FrontierPanel({ className, world, frontier, completed, total }) {
  return (
    <section className={cn(className)}>
      <SectionHeader title="Tech frontier" meta={`${completed} / ${total}`} />
      {frontier.length ? (
        <div className="divide-y divide-neutral-950/10">
          {frontier.map((building) => (
            <BuildingProgress
              key={building.id}
              building={building}
              storage={world.storages.find((storage) => storage.id === building.storageId)}
            />
          ))}
        </div>
      ) : <LaunchProgress world={world} />}
    </section>
  )
}
