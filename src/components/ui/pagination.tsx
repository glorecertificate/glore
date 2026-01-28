import type * as React from 'react'

import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from 'lucide-react'

import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const Pagination = ({ className, ...props }: React.ComponentProps<'nav'>) => (
  <nav
    aria-label="pagination"
    className={cn('mx-auto flex w-full justify-center', className)}
    data-slot="pagination"
    {...props}
  />
)

export const PaginationContent = ({ className, ...props }: React.ComponentProps<'ul'>) => (
  <ul className={cn('flex flex-row items-center gap-1', className)} data-slot="pagination-content" {...props} />
)

export const PaginationItem = ({ ...props }: React.ComponentProps<'li'>) => (
  <li data-slot="pagination-item" {...props} />
)

export const PaginationLink = ({
  active,
  className,
  size = 'icon',
  variant,
  ...props
}: React.ComponentProps<typeof Button> & {
  active?: boolean
}) => (
  <Button
    aria-current={active ? 'page' : undefined}
    className={cn(
      buttonVariants({ variant: variant ?? (active ? 'outline' : 'primary'), size }),
      'border',
      active && 'pointer-events-none',
      className
    )}
    data-active={active}
    data-slot="pagination-link"
    {...props}
  />
)

export const PaginationPrevious = ({ className, ...props }: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink aria-label="Go to previous page" className={cn('gap-1 px-2.5 sm:pl-2.5', className)} {...props}>
    <ChevronLeftIcon />
    <span className="hidden sm:block">{'Previous'}</span>
  </PaginationLink>
)

export const PaginationNext = ({ className, ...props }: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink aria-label="Go to next page" className={cn('gap-1 px-2.5 sm:pr-2.5', className)} {...props}>
    <span className="hidden sm:block">{'Next'}</span>
    <ChevronRightIcon />
  </PaginationLink>
)

export const PaginationEllipsis = ({ className, ...props }: React.ComponentProps<'span'>) => (
  <span
    aria-hidden
    className={cn('flex size-9 items-center justify-center', className)}
    data-slot="pagination-ellipsis"
    {...props}
  >
    <MoreHorizontalIcon className="size-4" />
    <span className="sr-only">{'More pages'}</span>
  </span>
)
