'use client'

import { Slot } from '@radix-ui/react-slot'
import { type VariantProps, cva } from 'class-variance-authority'

import { cn } from '@/lib/utils'

export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>

export const Badge = ({
  asChild = false,
  children,
  className,
  count,
  max = 99,
  size,
  variant,
  ...props
}: Omit<React.ComponentProps<'span'>, 'color'> &
  Omit<VariantProps<typeof badgeVariants>, 'pill'> & {
    asChild?: boolean
    count?: number
    max?: number
  }) => {
  const Component = asChild ? Slot : 'span'
  const isCount = count !== undefined
  return (
    <Component className={cn(badgeVariants({ pill: isCount, size, variant }), className)} data-slot="badge" {...props}>
      {isCount ? (
        <>
          <span aria-hidden={children ? true : undefined}>{count > max ? `${max}+` : count}</span>
          {children}
        </>
      ) : (
        children
      )}
    </Component>
  )
}

const badgeVariants = cva(
  `inline-flex w-fit shrink-0 cursor-default items-center justify-center overflow-hidden rounded-md whitespace-nowrap transition-[color] select-none focus-visible:focus-ring aria-invalid:border-destructive [&>svg]:pointer-events-none [&>svg]:size-3`,
  {
    defaultVariants: {
      pill: false,
      size: 'default',
      variant: 'primary',
    },
    compoundVariants: [
      { pill: true, size: 'sm', className: 'h-4 min-w-4 px-1 py-0' },
      { pill: true, size: 'default', className: 'h-5 min-w-5 px-1.5 py-0' },
      { pill: true, size: 'lg', className: 'h-6 min-w-6 px-2 py-0' },
    ],
    variants: {
      pill: {
        true: 'rounded-full font-medium tabular-nums',
        false: '',
      },
      size: {
        sm: 'gap-0.5 px-2 py-0.5 text-[11px]',
        default: 'gap-1 px-2 py-0.5 text-xs',
        lg: 'gap-1.5 px-2.5 py-1 text-sm',
      },
      variant: {
        primary: 'bg-primary text-primary-foreground shadow-xs',
        muted: 'bg-muted text-muted-foreground',
        outline: 'border border-border bg-field',
        ghost: 'bg-transparent text-foreground',
        brand: 'bg-brand text-brand-foreground shadow-xs',
        'brand-soft': 'bg-brand/10 text-brand-text',
        success: 'bg-success-subtle text-success-text',
        warning: 'bg-warning-subtle text-warning-text',
        destructive: 'bg-danger-subtle text-danger-text',
        info: 'bg-info-subtle text-info-text',
      },
    },
  }
)
