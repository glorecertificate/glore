'use client'

import { ChevronRight, MoreHorizontal } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Link, type LinkProps } from '@/components/ui/link'
import { type AnyUrl } from '@/lib/navigation'
import { cn } from '@/lib/utils'

export const Breadcrumb = ({ ...props }: React.ComponentProps<'nav'>) => (
  <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />
)

export const BreadcrumbList = ({ className, ...props }: React.ComponentProps<'ol'>) => (
  <ol
    className={cn(
      'flex flex-wrap items-center gap-0.5 break-words text-muted-foreground text-sm sm:gap-2.5',
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

export const BreadcrumbLink = <T extends AnyUrl>({ className, ...props }: LinkProps<T>) => (
  <BreadcrumbItem>
    <Button asChild className={cn('h-8 px-3 font-normal', className)} variant="ghost">
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
    className={cn('mr-2 [&>svg]:size-3.5', className)}
    data-slot="breadcrumb-separator"
    role="presentation"
    {...props}
  >
    {children ?? <ChevronRight />}
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
    <MoreHorizontal className="size-4" />
    <span className="sr-only">{'More'}</span>
  </span>
)
