import { LucideIcon } from '@/components/icons/lucide'
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
  <ol className={cn('flex w-full items-start', className)} data-slot="step-list" {...props}>
    {items.map((item, index) => (
      <li
        aria-current={item.state === 'current' ? 'step' : undefined}
        className="relative flex min-w-0 flex-1 flex-col items-center gap-2 px-0.5 text-center"
        key={item.key}
      >
        {index < items.length - 1 && (
          <span
            aria-hidden
            className={cn(
              'absolute top-3.5 right-[calc(-50%+1.125rem)] left-[calc(50%+1.125rem)] h-px bg-border',
              item.state === 'done' && 'bg-primary'
            )}
          />
        )}
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
            <LucideIcon className="size-3.5" name="check" />
          ) : item.state === 'failed' ? (
            <LucideIcon className="size-3.5" name="x" />
          ) : (
            index + 1
          )}
        </span>
        <div className="w-full min-w-0">
          <p
            className={cn(
              'text-[11px] leading-tight font-medium text-balance wrap-break-word sm:text-sm',
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
