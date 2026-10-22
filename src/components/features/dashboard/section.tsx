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
  <section className={cn('flex flex-col gap-3', className)} {...props}>
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      {action && (
        <Link className="text-sm font-medium" href={action.href} variant="primary">
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
  <Link
    className="block rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:dark:ring-ring/50"
    href={href}
  >
    <StatCard className={cn('h-full transition-colors hover:bg-accent/40', className)} {...props} />
  </Link>
)
