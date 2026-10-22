import { cn } from '@/lib/utils'

export const TimelineItem = ({
  children,
  className,
  dateTime,
  description,
  time,
  ...props
}: React.ComponentProps<'li'> & {
  dateTime: string
  description?: React.ReactNode
  time: string
}) => (
  <li
    className={cn('group/timeline-item relative flex gap-4 pb-6 last:pb-0', className)}
    data-slot="timeline-item"
    {...props}
  >
    <div aria-hidden className="relative flex w-3 shrink-0 justify-center">
      <span className="mt-1.5 size-2.5 rounded-full bg-brand-text" />
      <span className="absolute top-5 bottom-0 w-px bg-border group-last/timeline-item:hidden" />
    </div>
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div className="text-sm font-medium">{children}</div>
        <time className="text-xs text-muted-foreground" dateTime={dateTime}>
          {time}
        </time>
      </div>
      {description && <div className="text-sm text-muted-foreground">{description}</div>}
    </div>
  </li>
)
