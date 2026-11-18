import { PageHeader, PageHeaderActions, PageHeaderDescription, PageHeaderHeading } from '@/components/ui/page-header'
import { cn } from '@/lib/utils'

export const AdminPage = ({
  actions,
  children,
  className,
  description,
  ...props
}: Omit<React.ComponentProps<'div'>, 'children' | 'title'> & {
  actions?: React.ReactNode
  children?: React.ReactNode
  description: React.ReactNode
}) => (
  <div className={cn('flex min-w-0 flex-col gap-6', className)} data-slot="admin-page" {...props}>
    <PageHeader className="sm:items-center">
      <PageHeaderHeading>
        <PageHeaderDescription>{description}</PageHeaderDescription>
      </PageHeaderHeading>
      {actions && <PageHeaderActions>{actions}</PageHeaderActions>}
    </PageHeader>
    {children}
  </div>
)
