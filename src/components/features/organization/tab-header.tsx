import { PageHeader, PageHeaderActions, PageHeaderDescription, PageHeaderHeading } from '@/components/ui/page-header'
import { cn } from '@/lib/utils'

export const TabHeader = ({
  actions,
  as: Heading = 'h2',
  className,
  description,
  title,
}: {
  actions?: React.ReactNode
  as?: 'h2' | 'h3'
  className?: string
  description?: React.ReactNode
  title: React.ReactNode
}) => (
  <PageHeader className={cn('sm:items-end', className)}>
    <PageHeaderHeading className="gap-1">
      <Heading className="type-heading text-balance text-foreground">{title}</Heading>
      {description && <PageHeaderDescription className="text-sm">{description}</PageHeaderDescription>}
    </PageHeaderHeading>
    {actions && <PageHeaderActions>{actions}</PageHeaderActions>}
  </PageHeader>
)
