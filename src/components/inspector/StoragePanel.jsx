import { RESOURCE_CONFIG } from '../../config/simulation.js'
import { cn } from '../../lib/cn.js'
import { SectionHeader } from '../ui/SectionHeader.jsx'

const sumResources = (resources) => Object.values(resources).reduce((sum, value) => sum + value, 0)

export function StoragePanel({ className, storage }) {
  return (
    <section className={cn(className)}>
      <SectionHeader title="Camp storage" meta={`${sumResources(storage)} TOTAL`} />
      <dl className="grid grid-cols-2">
        {Object.entries(RESOURCE_CONFIG).map(([resource, meta], index) => (
          <div key={resource} className={cn('flex min-w-0 items-center gap-3 px-4 py-3', index > 1 && 'border-t border-neutral-950/10', index % 2 === 1 && 'border-l border-neutral-950/10')}>
            <dt className="grid size-7 shrink-0 place-items-center rounded-md bg-neutral-100 text-sm font-semibold text-neutral-600">{meta.code}</dt>
            <dd className="flex min-w-0 flex-1 items-center justify-between gap-2">
              <span className="truncate text-sm text-neutral-600">{meta.label}</span>
              <span className="text-base tabular-nums font-semibold text-neutral-950">{String(storage[resource]).padStart(2, '0')}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
