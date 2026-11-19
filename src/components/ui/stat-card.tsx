import { useFormatter } from 'next-intl'

import { LucideIcon } from '@/components/icons/lucide'
import { type IconName } from '@/components/icons/registry'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SkeletonText } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const PLACEHOLDER_VALUE = '00'

export const STAT_ACCENTS = {
  amber: 'stat-accent-amber',
  green: 'stat-accent-green',
  navy: 'stat-accent-navy',
  teal: 'stat-accent-teal',
} as const

export type StatAccent = keyof typeof STAT_ACCENTS

export const StatCard = ({
  accent = 'teal',
  children,
  className,
  description,
  format,
  icon,
  label,
  loading = false,
  value,
  ...props
}: Omit<React.ComponentProps<typeof Card>, 'title'> & {
  accent?: StatAccent
  description?: React.ReactNode
  format?: Parameters<ReturnType<typeof useFormatter>['number']>[2]
  icon?: IconName
  label: string
  loading?: boolean
  value: number
}) => {
  const { number } = useFormatter()

  return (
    <Card className={cn('relative justify-between', STAT_ACCENTS[accent], className)} data-slot="stat-card" {...props}>
      <CardHeader className="gap-2">
        <div className="flex items-center gap-2.5">
          {icon && (
            <span
              aria-hidden
              className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-stat-text"
            >
              <LucideIcon className="size-4" name={icon} />
            </span>
          )}
          <CardDescription className="text-fg-1">{label}</CardDescription>
        </div>
        <CardTitle className="type-stat">
          {loading ? (
            <SkeletonText>{PLACEHOLDER_VALUE}</SkeletonText>
          ) : (
            <span className="tabular-nums">{number(value, format ?? {})}</span>
          )}
        </CardTitle>
      </CardHeader>
      {(description || children) && (
        <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
          {loading && description ? <SkeletonText>{description}</SkeletonText> : description}
          {children}
        </CardContent>
      )}
    </Card>
  )
}
