import { EVENT_LABELS } from '../../config/ui.ts'
import { cn } from '../../lib/cn.ts'
import { SectionHeader } from '../ui/SectionHeader.tsx'

export function EventPanel({ className = '', events }) {
  return (
    <section className={cn(className)}>
      <SectionHeader title="Event log" meta="LATEST 5" />
      <div role="log" aria-live="polite">
        {events.slice(-5).reverse().map((event, index) => (
          <article key={event.id} className={cn('grid grid-cols-[3.75rem_minmax(0,1fr)] gap-3 px-4 py-3', index > 0 && 'border-t border-neutral-950/10')}>
            <div className="text-sm tabular-nums text-neutral-400">T{String(event.tick).padStart(4, '0')}</div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-neutral-700">{EVENT_LABELS[event.type] ?? event.type}</p>
              <p className="text-base/6 text-pretty text-neutral-600 sm:text-sm/5">{event.message}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
