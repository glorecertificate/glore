import { type Route } from 'next'

import { Link } from '@/components/ui/link'
import { StatCard } from '@/components/ui/stat-card'
import { cn } from '@/lib/utils'

export const DashboardSection = ({
  action,
  children,
  className,
  title,
  ...props
}: Omit<React.ComponentProps<'section'>, 'title'> & {
  action?: { href: Route; label: string }
  title: string
}) => (
  <section className={cn('flex min-w-0 flex-col gap-3', className)} {...props}>
    <div className="flex items-center justify-between gap-3">
      <h2 className="type-heading text-foreground">{title}</h2>
      {action && (
        <Link className="shrink-0 text-sm font-medium" href={action.href} variant="primary">
          {action.label}
        </Link>
      )}
    </div>
    {children}
  </section>
)

export const StatLink = ({
  className,
  href,
  ...props
}: React.ComponentProps<typeof StatCard> & {
  href: Route
}) => (
  <Link className="block min-w-0 rounded-xl outline-none focus-visible:focus-ring" href={href}>
    <StatCard className={cn('h-full gap-4 p-5 transition-colors hover:bg-accent/40', className)} {...props} />
  </Link>
)
