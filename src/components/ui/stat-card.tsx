import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { NumberTicker } from '@/components/ui/number-ticker'
import { cn } from '@/lib/utils'

export const StatCard = ({
  children,
  className,
  description,
  format,
  label,
  value,
  ...props
}: Omit<React.ComponentProps<typeof Card>, 'title'> & {
  description?: React.ReactNode
  format?: React.ComponentProps<typeof NumberTicker>['format']
  label: string
  value: number
}) => (
  <Card className={cn('justify-between', className)} data-slot="stat-card" {...props}>
    <CardHeader>
      <CardDescription>{label}</CardDescription>
      <CardTitle className="text-3xl">
        <NumberTicker format={format} value={value} />
      </CardTitle>
    </CardHeader>
    {(description || children) && (
      <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
        {description}
        {children}
      </CardContent>
    )}
  </Card>
)
