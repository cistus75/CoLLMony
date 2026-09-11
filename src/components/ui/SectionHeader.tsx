import { cn } from '../../lib/cn.ts'

export function SectionHeader({ title, meta, className = '' }) {
  return (
    <div className={cn('flex items-center justify-between gap-3 border-b border-neutral-950/10 px-4 py-3', className)}>
      <h2 className="text-base font-semibold sm:text-sm">{title}</h2>
      <p className="text-sm tabular-nums text-neutral-500">{meta}</p>
    </div>
  )
}
