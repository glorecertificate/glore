import { type JourneyStageState } from '@/actions/dashboard/core'
import { LucideIcon } from '@/components/icons/lucide'
import { cn } from '@/lib/utils'

export const JourneyMarker = ({
  className,
  state,
  tone = 'neutral',
}: {
  className?: string
  state: JourneyStageState
  tone?: 'danger' | 'neutral'
}) => (
  <span
    aria-hidden
    className={cn(
      'relative z-1 flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors duration-240 ease-out motion-reduce:transition-none',
      state === 'done' && 'border-earned-border bg-earned-subtle text-earned-text',
      state === 'current' && 'border-2 border-current-fill bg-surface-0',
      state === 'upcoming' && 'border-border-strong bg-surface-0',
      state === 'ended' && tone === 'danger' && 'border-danger-border bg-danger-subtle text-danger-text',
      state === 'ended' && tone === 'neutral' && 'border-border-strong bg-surface-muted text-fg-2',
      className
    )}
    data-slot="journey-marker"
    data-state={state}
  >
    <LucideIcon
      className={cn(
        'absolute size-3.5 transition duration-240 ease-out motion-reduce:transition-none',
        state === 'done' ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
      )}
      name="check"
    />
    {state === 'current' && <span className="size-2 rounded-full bg-current-fill" />}
    {state === 'ended' && <LucideIcon className="size-3.5" name={tone === 'danger' ? 'x' : 'minus'} />}
  </span>
)
