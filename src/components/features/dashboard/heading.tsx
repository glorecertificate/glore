import { type Route } from 'next'

import { LucideIcon } from '@/components/icons/lucide'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderDescription,
  PageHeaderHeading,
  PageHeaderTitle,
} from '@/components/ui/page-header'

export const DashboardHeading = ({
  action,
  organization,
  subtitle,
  title,
}: {
  action?: { href: Route; label: string }
  organization: string | null
  subtitle: string
  title: string
}) => (
  <PageHeader>
    <PageHeaderHeading>
      <PageHeaderTitle>{title}</PageHeaderTitle>
      <PageHeaderDescription>{subtitle}</PageHeaderDescription>
      {organization && (
        <p className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
          <LucideIcon className="size-3.5 shrink-0" name="building-2" />
          <span className="truncate">{organization}</span>
        </p>
      )}
    </PageHeaderHeading>
    {action && (
      <PageHeaderActions>
        <Button asChild variant="brand">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      </PageHeaderActions>
    )}
  </PageHeader>
)
