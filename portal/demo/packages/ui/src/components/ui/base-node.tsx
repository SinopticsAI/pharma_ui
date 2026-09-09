import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

/**
 * Базовый узел React Flow UI: копия регистра, лежит в репозитории.
 * https://ui.reactflow.dev/base-node
 */
export function BaseNode({ selected, className, ...props }: HTMLAttributes<HTMLDivElement> & { selected?: boolean }) {
  return (
    <div
      data-slot="base-node"
      className={cn(
        'rounded-md border bg-card p-3 text-card-foreground shadow-sm',
        selected && 'border-primary ring-1 ring-primary',
        className,
      )}
      {...props}
    />
  )
}
