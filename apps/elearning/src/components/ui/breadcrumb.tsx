import { ChevronRightIcon, MoreHorizontalIcon } from 'lucide-react'

import { DashboardButton } from '@/components/layout/dashboard-button'
import { type DashboardLinkProps } from '@/components/layout/dashboard-link'
import { type ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const Breadcrumb = ({ ...props }: React.ComponentProps<'nav'>) => (
  <nav aria-label="breadcrumb" className="ml-0 h-full" data-slot="breadcrumb" {...props} />
)

const BreadcrumbList = ({ className, ...props }: React.ComponentProps<'ol'>) => (
  <ul
    className={cn('flex flex-wrap items-center gap-1.5 text-sm break-words text-muted-foreground sm:gap-2.5', className)}
    data-slot="breadcrumb-list"
    {...props}
  />
)

const BreadcrumbItem = ({ className, ...props }: React.ComponentProps<'li'>) => (
  <li className={cn('inline-flex items-center gap-1.5', className)} data-slot="breadcrumb-item" {...props} />
)

const BreadcrumbButton = ({ className, to, ...props }: DashboardLinkProps & ButtonProps) => (
  <DashboardButton
    className={cn('text-base text-foreground/75 hover:text-foreground', className)}
    data-slot="breadcrumb-link"
    to={to}
    variant="ghost"
    {...props}
  />
)

const BreadcrumbPage = ({ className, ...props }: React.ComponentProps<'span'>) => (
  <span
    aria-current="page"
    aria-disabled="true"
    className={cn(
      'inline-flex h-9 items-center justify-center gap-2 px-2 py-2 text-base font-medium text-foreground/95 has-[>svg]:px-3',
      className,
    )}
    data-slot="breadcrumb-page"
    role="link"
    {...props}
  />
)

const BreadcrumbSeparator = ({ children, className, ...props }: React.ComponentProps<'li'>) => (
  <li
    aria-hidden="true"
    className={cn('[&>svg]:size-3.5', className)}
    data-slot="breadcrumb-separator"
    role="presentation"
    {...props}
  >
    {children ?? <ChevronRightIcon />}
  </li>
)

const BreadcrumbEllipsis = ({ className, ...props }: React.ComponentProps<'span'>) => (
  <span
    aria-hidden="true"
    className={cn('flex size-9 items-center justify-center', className)}
    data-slot="breadcrumb-ellipsis"
    role="presentation"
    {...props}
  >
    <MoreHorizontalIcon className="size-4" />
  </span>
)

export { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbButton, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis }
