import { ChevronRightIcon, MoreHorizontalIcon } from 'lucide-react'

import { AppButton, type AppButtonProps } from '@/components/layout/app-button'
import { cn } from '@/lib/utils'

export const Breadcrumb = ({ ...props }: React.ComponentProps<'nav'>) => (
  <nav aria-label="breadcrumb" className="ml-0 h-full" data-slot="breadcrumb" {...props} />
)

export const BreadcrumbList = ({ className, ...props }: React.ComponentProps<'ol'>) => (
  <ul
    className={cn('flex flex-wrap items-center gap-1.5 text-sm break-words text-muted-foreground sm:gap-2.5', className)}
    data-slot="breadcrumb-list"
    {...props}
  />
)

export const BreadcrumbItem = ({ className, ...props }: React.ComponentProps<'li'>) => (
  <li className={cn('inline-flex items-center gap-1.5', className)} data-slot="breadcrumb-item" {...props} />
)

export const BreadcrumbButton = ({ className, to, ...props }: AppButtonProps) => (
  <AppButton
    className={cn('text-base text-foreground/75 hover:text-foreground', className)}
    data-slot="breadcrumb-link"
    to={to}
    variant="ghost"
    {...props}
  />
)

export const BreadcrumbPage = ({ className, ...props }: React.ComponentProps<'span'>) => (
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

export const BreadcrumbSeparator = ({ children, className, ...props }: React.ComponentProps<'li'>) => (
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

export const BreadcrumbEllipsis = ({ className, ...props }: React.ComponentProps<'span'>) => (
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
