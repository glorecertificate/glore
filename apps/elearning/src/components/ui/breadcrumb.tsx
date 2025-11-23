'use client'

import { ChevronRightIcon, MoreHorizontalIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Link, type LinkProps } from '@/components/ui/link'
import { cn } from '@/lib/utils'

export const Breadcrumb = ({ ...props }: React.ComponentProps<'nav'>) => (
  <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />
)

export const BreadcrumbList = ({ className, ...props }: React.ComponentProps<'ol'>) => (
  <ol
    className={cn(
      'wrap-break-word flex flex-wrap items-center gap-0.5 text-muted-foreground text-sm sm:gap-2.5',
      className
    )}
    data-slot="breadcrumb-list"
    {...props}
  />
)

export const BreadcrumbItem = ({ className, ...props }: React.ComponentProps<'li'>) => (
  <li
    className={cn('inline-flex items-center gap-1.5 font-medium', className)}
    data-slot="breadcrumb-item"
    {...props}
  />
)

export const BreadcrumbLink = <T,>({ className, ...props }: LinkProps<T>) => (
  <BreadcrumbItem>
    <Button asChild className={cn('h-8 px-2 text-muted-foreground', className)} variant="ghost">
      <Link {...props} />
    </Button>
  </BreadcrumbItem>
)

export const BreadcrumbPage = ({ className, ...props }: React.ComponentProps<'span'>) => (
  <span
    aria-current="page"
    aria-disabled="true"
    className={cn('font-normal text-foreground', className)}
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
    <span className="sr-only">{'More'}</span>
  </span>
)
