import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { NumberTicker } from '@/components/ui/number-ticker'
import { SkeletonText } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const PLACEHOLDER_VALUE = '00'

export const StatCard = ({
  children,
  className,
  description,
  format,
  label,
  loading = false,
  value,
  ...props
}: Omit<React.ComponentProps<typeof Card>, 'title'> & {
  description?: React.ReactNode
  format?: React.ComponentProps<typeof NumberTicker>['format']
  label: string
  loading?: boolean
  value: number
}) => (
  <Card className={cn('justify-between', className)} data-slot="stat-card" {...props}>
    <CardHeader>
      <CardDescription>{label}</CardDescription>
      <CardTitle className="text-3xl">
        {loading ? <SkeletonText>{PLACEHOLDER_VALUE}</SkeletonText> : <NumberTicker format={format} value={value} />}
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
