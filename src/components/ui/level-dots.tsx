import { cn } from '@/lib/utils'

export const LevelDots = ({
  className,
  label,
  level,
  ...props
}: React.ComponentProps<'div'> & {
  label: string
  level: 1 | 2 | 3 | 4 | 5
}) => (
  <div className={cn('flex items-center gap-3', className)} data-slot="level-dots" {...props}>
    <span aria-hidden className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map(dot => (
        <span className={cn('size-2.5 rounded-full bg-muted', dot <= level && 'bg-brand-secondary-text')} key={dot} />
      ))}
    </span>
    <span className="text-sm font-medium">{label}</span>
  </div>
)
