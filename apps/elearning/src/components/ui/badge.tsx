'use client'

import { useMemo } from 'react'

import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

export interface BadgeProps extends Omit<React.ComponentProps<'span'>, 'color'>, VariantProps<typeof badge> {
  asChild?: boolean
}

export const Badge = ({ asChild = false, className, color, size, variant, ...props }: BadgeProps) => {
  const Component = useMemo(() => (asChild ? Slot : 'span'), [asChild])
  return <Component className={cn(badge({ color, size, variant }), className)} data-slot="badge" {...props} />
}

export const badge = cva(
  `
    inline-flex w-fit shrink-0 cursor-default items-center justify-center overflow-hidden rounded-md border border-transparent font-medium whitespace-nowrap
    transition-[color]
    focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50
    aria-invalid:border-destructive aria-invalid:ring-destructive/20
    dark:aria-invalid:ring-destructive/40
    [&>svg]:pointer-events-none [&>svg]:size-3
  `,
  {
    defaultVariants: {
      color: 'default',
      size: 'md',
      variant: 'default',
    },
    variants: {
      color: {
        default: 'bg-default text-default-foreground',
        inverted: 'bg-inverted text-inverted-foreground',
        primary: 'border-primary bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
        'primary.accent': 'border-primary-accent bg-primary-accent text-primary-foreground',
        secondary: 'border-secondary bg-secondary text-secondary-foreground',
        'secondary.accent': 'border-secondary-accent bg-secondary-accent text-secondary-foreground',
        destructive: `
          border-destructive bg-destructive text-white
          focus-visible:ring-destructive/20
          dark:bg-destructive/70 dark:focus-visible:ring-destructive/40
          [a&]:hover:bg-destructive/90
        `,
        success: `
          border-success bg-success text-success-foreground
          focus-visible:ring-success/20
          dark:bg-success/70 dark:focus-visible:ring-success/40
          [a&]:hover:bg-success/90
        `,
        muted: 'bg-muted text-muted-foreground dark:bg-accent',
      },
      size: {
        xs: 'gap-0.5 px-1 py-[1px] text-[10px]',
        sm: 'gap-1 px-2 py-0.5 text-xs',
        md: 'gap-1.5 px-2.5 py-1 text-sm',
        lg: 'gap-2 px-3 py-1.5 text-base',
      },
      variant: {
        default: '',
        outline: 'border !bg-transparent',
        ghost: 'bg-transparent text-foreground',
      },
    },
    compoundVariants: [
      {
        color: 'default',
        variant: 'outline',
        className: 'border-foreground/50 bg-transparent text-foreground/80',
      },
      {
        color: 'primary',
        variant: 'outline',
        className: 'border-primary/80 bg-transparent text-primary',
      },
      {
        color: 'secondary',
        variant: 'outline',
        className: 'border-secondary/80 bg-transparent text-secondary',
      },
      {
        color: 'destructive',
        variant: 'outline',
        className: 'border-destructive/50 bg-transparent text-destructive/80',
      },
      {
        color: 'muted',
        variant: 'outline',
        className: 'border-muted-foreground/50 bg-transparent text-muted-foreground/80',
      },
      {
        color: 'primary.accent',
        variant: 'outline',
        className: 'border-primary-accent/80 bg-transparent text-primary-accent',
      },
      {
        color: 'secondary.accent',
        variant: 'outline',
        className: 'border-secondary-accent/80 bg-transparent text-secondary-accent',
      },
    ],
  },
)
