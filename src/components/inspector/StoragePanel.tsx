import { useEffect, useState } from 'react'
import { RESOURCE_CONFIG } from '../../config/simulation.ts'
import { RESOURCE_GROUP_LABELS } from '../../config/ui.ts'
import { cn } from '../../lib/cn.ts'
import { SectionHeader } from '../ui/SectionHeader.tsx'
import { Select } from '../ui/Select.tsx'

const sumResources = (resources) => (Object.values(resources) as number[]).reduce((sum, value) => sum + value, 0)

export function StoragePanel({ className = '', storages }) {
  const [selectedStorageId, setSelectedStorageId] = useState('camp')
  const storage = storages.find((item) => item.id === selectedStorageId) ?? storages[0]
  const total = storages.reduce((sum, item) => sum + sumResources(item.resources), 0)
  const groups = Object.entries(RESOURCE_GROUP_LABELS).map(([kind, label]) => ({
    kind,
    label,
    resources: Object.entries(RESOURCE_CONFIG).filter(([, meta]) => meta.kind === kind),
  }))

  useEffect(() => {
    if (!storages.some((item) => item.id === selectedStorageId)) setSelectedStorageId(storages[0].id)
  }, [selectedStorageId, storages])

  return (
    <section className={cn(className)}>
      <SectionHeader title="Storage" meta={`${total} TOTAL`} />
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 border-b border-neutral-950/10 px-4 py-3">
        <label htmlFor="storage-select" className="text-sm font-medium text-neutral-700">저장소</label>
        <Select id="storage-select" value={storage.id} onChange={(event) => setSelectedStorageId(event.target.value)}>
          {storages.map((item) => <option key={item.id} value={item.id}>{item.name} · {sumResources(item.resources)}</option>)}
        </Select>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {groups.map((group) => (
          <div key={group.kind} className="border-t border-neutral-950/10 first:border-t-0">
            <p className="bg-neutral-50 px-4 py-2 text-xs font-semibold tracking-wide text-neutral-500">{group.label}</p>
            <dl className="grid grid-cols-2">
              {group.resources.map(([resource, meta], index) => (
                <div key={resource} className={cn('flex min-w-0 items-center gap-3 px-4 py-3', index > 1 && 'border-t border-neutral-950/10', index % 2 === 1 && 'border-l border-neutral-950/10')}>
                  <dt className="grid size-7 shrink-0 place-items-center rounded-md bg-neutral-100 text-sm font-semibold text-neutral-600">{meta.code}</dt>
                  <dd className="flex min-w-0 flex-1 items-center justify-between gap-2">
                    <span className="truncate text-sm text-neutral-600">{meta.label}</span>
                    <span className="text-base tabular-nums font-semibold text-neutral-950">{String(storage.resources[resource]).padStart(2, '0')}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </section>
  )
}
