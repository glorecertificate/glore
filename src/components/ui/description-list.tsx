import { type VariantProps, cva } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const descriptionListVariants = cva('group/dl min-w-0 text-sm', {
  defaultVariants: {
    layout: 'stacked',
  },
  variants: {
    layout: {
      inline: 'flex flex-col gap-2',
      rows: 'divide-y divide-border-subtle',
      stacked: 'grid gap-3',
    },
  },
})

interface DescriptionListProps extends React.ComponentProps<'dl'>, VariantProps<typeof descriptionListVariants> {
  columns?: 1 | 2
}

export const DescriptionList = ({ className, columns = 1, layout, ...props }: DescriptionListProps) => (
  <dl
    className={cn(descriptionListVariants({ layout }), columns === 2 && 'sm:grid-cols-2', className)}
    data-layout={layout ?? 'stacked'}
    data-slot="description-list"
    {...props}
  />
)

export const DescriptionItem = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    className={cn(
      'flex min-w-0 flex-col gap-0.5',
      'group-data-[layout=inline]/dl:flex-row group-data-[layout=inline]/dl:flex-wrap group-data-[layout=inline]/dl:justify-between group-data-[layout=inline]/dl:gap-x-4',
      'group-data-[layout=rows]/dl:grid group-data-[layout=rows]/dl:py-2.5 sm:group-data-[layout=rows]/dl:grid-cols-[12rem_1fr] sm:group-data-[layout=rows]/dl:gap-4',
      className
    )}
    data-slot="description-item"
    {...props}
  />
)

export const DescriptionTerm = ({ className, ...props }: React.ComponentProps<'dt'>) => (
  <dt
    className={cn(
      'text-xs text-muted-foreground group-data-[layout=inline]/dl:text-sm group-data-[layout=rows]/dl:text-sm',
      className
    )}
    data-slot="description-term"
    {...props}
  />
)

export const DescriptionDetails = ({ className, ...props }: React.ComponentProps<'dd'>) => (
  <dd
    className={cn(
      'min-w-0 wrap-break-word group-data-[layout=inline]/dl:text-right group-data-[layout=inline]/dl:font-medium group-data-[layout=rows]/dl:font-medium',
      className
    )}
    data-slot="description-details"
    {...props}
  />
)
