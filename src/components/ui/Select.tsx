import { cn } from '../../lib/cn.ts'

export function Select({ className = '', children, ...props }) {
  return (
    <select
      className={cn(
        'min-w-0 rounded-md bg-neutral-100 px-3 py-3 text-base font-medium text-neutral-800 ring-1 ring-neutral-950/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-700 sm:py-2 sm:text-sm',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}
