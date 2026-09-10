import { RESOURCE_CONFIG } from '../../config/simulation.js'
import { cn } from '../../lib/cn.js'
import { SectionHeader } from '../ui/SectionHeader.jsx'

export function FrontierPanel({ className, frontier, storage, completed, total }) {
  const current = frontier[0]
  const inputs = current ? Object.entries(current.inputs) : []
  const inputProgress = inputs.length
    ? inputs.reduce((sum, [resource, amount]) => sum + Math.min(storage[resource] / amount, 1), 0) / inputs.length
    : 1
  const progress = current?.status === 'UNDER_CONSTRUCTION'
    ? 1 - (current.workRemaining / current.duration)
    : inputProgress

  return (
    <section className={cn(className)}>
      <SectionHeader title="Tech frontier" meta={`${completed} / ${total}`} />
      <div className="grid gap-3 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold">{current?.name ?? '전체 기술 완료'}</h3>
            <p className="text-sm text-neutral-500">{current ? `Tier ${current.tier} · ${current.size.width} × ${current.size.height} cells` : '모든 건물이 완성되었습니다.'}</p>
          </div>
          {current && <p className="shrink-0 text-sm tabular-nums font-medium text-neutral-700">{current.status === 'UNDER_CONSTRUCTION' ? `${current.workRemaining} WORK` : 'REVEALED'}</p>}
        </div>
        {current && (
          <>
            <p className="text-base/6 text-pretty text-neutral-600 sm:text-sm/5">
              {inputs.map(([resource, amount]) => `${RESOURCE_CONFIG[resource].label} ${storage[resource]}/${amount}`).join(' · ')}
            </p>
            <div className="h-1.5 overflow-hidden rounded-full bg-neutral-200" aria-label={`진행률 ${Math.round(progress * 100)}%`}>
              <div className="h-full rounded-full bg-neutral-950" style={{ width: `${progress * 100}%` }} />
            </div>
          </>
        )}
      </div>
    </section>
  )
}
