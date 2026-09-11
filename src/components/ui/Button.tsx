import { cn } from '../../lib/cn.ts'

export function Button({ active = false, primary = false, className = '', children, ...props }) {
  const tone = primary
    ? 'bg-neutral-950 text-white hover:bg-neutral-800'
    : active
      ? 'bg-neutral-200 text-neutral-950 ring-neutral-950/15 hover:bg-neutral-300'
      : 'bg-white text-neutral-700 ring-neutral-950/10 hover:bg-neutral-100'

  return (
    <button
      className={cn(
        'relative min-h-12 rounded-md px-3 text-base font-medium ring-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-700 sm:min-h-9 sm:text-sm',
        tone,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
