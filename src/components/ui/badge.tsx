'use client'

import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

export const Badge = ({
  asChild = false,
  className,
  size,
  variant,
  ...props
}: Omit<React.ComponentProps<'span'>, 'color'> &
  VariantProps<typeof badgeVariants> & {
    asChild?: boolean
  }) => {
  const Component = asChild ? Slot : 'span'
  return <Component className={cn(badgeVariants({ size, variant }), className)} data-slot="badge" {...props} />
}

const badgeVariants = cva(
  `
    inline-flex w-fit shrink-0 cursor-default items-center justify-center overflow-hidden rounded-md
    whitespace-nowrap transition-[color] select-none
    focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50
    aria-invalid:border-destructive aria-invalid:ring-destructive/20
    dark:aria-invalid:ring-destructive/40
    [&>svg]:pointer-events-none [&>svg]:size-3
  `,
  {
    defaultVariants: {
      size: 'default',
      variant: 'primary',
    },
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground shadow-xs',
        muted: 'bg-muted text-muted-foreground',
        outline: 'border border-input bg-background shadow-xs dark:bg-input/30',
        ghost: 'bg-transparent text-foreground',
      },
      size: {
        sm: 'gap-0.5 px-2 py-0.5 text-[11px]',
        default: 'gap-1 px-2 py-0.5 text-xs',
        lg: 'gap-1.5 px-2.5 py-1 text-sm',
      },
    },
  }
)
