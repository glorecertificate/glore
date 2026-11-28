import { cn } from '@/lib/utils'

export const ChartLegend = ({
  className,
  items,
}: {
  className?: string
  items: { color: string; label: string }[]
}) => (
  <ul
    className={cn(
      'flex flex-wrap items-center justify-end gap-x-4 gap-y-1 pt-3 text-xs text-muted-foreground',
      className
    )}
  >
    {items.map(({ color, label }) => (
      <li className="flex items-center gap-1.5" key={label}>
        <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
        {label}
      </li>
    ))}
  </ul>
)
