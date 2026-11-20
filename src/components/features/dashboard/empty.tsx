import { LucideIcon } from '@/components/icons/lucide'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { type IconName } from '@/lib/types'
import { cn } from '@/lib/utils'

export const DashboardEmpty = ({
  className,
  description,
  icon,
  title,
}: {
  className?: string
  description?: string
  icon: IconName
  title: string
}) => (
  <Empty className={cn('gap-3 bg-card p-4 md:p-6', className)}>
    <EmptyHeader>
      <EmptyMedia variant="icon">
        <LucideIcon name={icon} />
      </EmptyMedia>
      <EmptyTitle className="text-base">{title}</EmptyTitle>
      {description && <EmptyDescription>{description}</EmptyDescription>}
    </EmptyHeader>
  </Empty>
)
