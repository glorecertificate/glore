'use client'

import { cn } from '@repo/ui/utils'

export const Table = ({ className, ...props }: React.ComponentProps<'table'>) => (
  <div className="relative w-full overflow-x-auto" data-slot="table-container">
    <table className={cn('w-full caption-bottom text-sm', className)} data-slot="table" {...props} />
  </div>
)

export const TableHeader = ({ className, ...props }: React.ComponentProps<'thead'>) => (
  <thead className={cn('[&_tr]:border-b', className)} data-slot="table-header" {...props} />
)

export const TableBody = ({ className, ...props }: React.ComponentProps<'tbody'>) => (
  <tbody className={cn('[&_tr:last-child]:border-0', className)} data-slot="table-body" {...props} />
)

export const TableFooter = ({ className, ...props }: React.ComponentProps<'tfoot'>) => (
  <tfoot
    className={cn('border-t bg-muted/50 font-medium [&>tr]:last:border-b-0', className)}
    data-slot="table-footer"
    {...props}
  />
)

export const TableRow = ({ className, ...props }: React.ComponentProps<'tr'>) => (
  <tr
    className={cn('border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted', className)}
    data-slot="table-row"
    {...props}
  />
)

export const TableHead = ({ className, ...props }: React.ComponentProps<'th'>) => (
  <th
    className={cn(
      `
        h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground
        [&:has([role=checkbox])]:pr-0
        [&>[role=checkbox]]:translate-y-[2px]
      `,
      className,
    )}
    data-slot="table-head"
    {...props}
  />
)

export const TableCell = ({ className, ...props }: React.ComponentProps<'td'>) => (
  <td
    className={cn(
      'p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
      className,
    )}
    data-slot="table-cell"
    {...props}
  />
)

export const TableCaption = ({ className, ...props }: React.ComponentProps<'caption'>) => (
  <caption className={cn('mt-4 text-sm text-muted-foreground', className)} data-slot="table-caption" {...props} />
)
