import { CheckIcon, XIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

type StepState = 'current' | 'done' | 'failed' | 'upcoming'

export interface StepItem {
  description?: string
  key: string
  label: string
  state: StepState
}

export const StepList = ({
  className,
  items,
  ...props
}: Omit<React.ComponentProps<'ol'>, 'children'> & { items: StepItem[] }) => (
  <ol className={cn('flex w-full items-start gap-1 sm:gap-2', className)} data-slot="step-list" {...props}>
    {items.map((item, index) => (
      <li
        aria-current={item.state === 'current' ? 'step' : undefined}
        className="flex min-w-0 flex-1 flex-col gap-2"
        key={item.key}
      >
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium',
              item.state === 'done' && 'border-primary bg-primary text-primary-foreground',
              item.state === 'current' && 'border-primary text-brand-text ring-4 ring-primary/15',
              item.state === 'failed' && 'border-destructive bg-destructive text-destructive-foreground',
              item.state === 'upcoming' && 'text-muted-foreground'
            )}
          >
            {item.state === 'done' ? (
              <CheckIcon className="size-3.5" />
            ) : item.state === 'failed' ? (
              <XIcon className="size-3.5" />
            ) : (
              index + 1
            )}
          </span>
          {index < items.length - 1 && (
            <span aria-hidden className={cn('h-px flex-1 bg-border', item.state === 'done' && 'bg-primary')} />
          )}
        </div>
        <div className="min-w-0 sm:pr-2">
          <p
            className={cn(
              'text-[11px] leading-tight font-medium wrap-break-word hyphens-auto sm:text-sm',
              item.state === 'upcoming' ? 'text-muted-foreground' : 'text-foreground'
            )}
          >
            {item.label}
          </p>
          {item.description && (
            <p className="hidden truncate text-xs text-muted-foreground sm:block">{item.description}</p>
          )}
        </div>
      </li>
    ))}
  </ol>
)
