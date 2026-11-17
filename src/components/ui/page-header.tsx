import { cn } from '@/lib/utils'

export const PageHeader = ({ className, ...props }: React.ComponentProps<'header'>) => (
  <header
    className={cn('flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between', className)}
    data-slot="page-header"
    {...props}
  />
)

export const PageHeaderHeading = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div className={cn('flex min-w-0 flex-col gap-1.5', className)} data-slot="page-header-heading" {...props} />
)

export const PageHeaderTitle = ({ children, className, ...props }: React.ComponentProps<'h1'>) => (
  <h1 className={cn('type-title text-balance text-foreground', className)} data-slot="page-header-title" {...props}>
    {children}
  </h1>
)

export const PageHeaderDescription = ({ className, ...props }: React.ComponentProps<'p'>) => (
  <p
    className={cn('max-w-prose text-base text-pretty text-muted-foreground', className)}
    data-slot="page-header-description"
    {...props}
  />
)

export const PageHeaderActions = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    className={cn('flex shrink-0 flex-wrap items-center gap-2', className)}
    data-slot="page-header-actions"
    {...props}
  />
)
