'use client'

import { useMemo } from 'react'

import { Slot } from '@radix-ui/react-slot'
import { type VariantProps, cva } from 'class-variance-authority'

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
    inline-flex w-fit shrink-0 cursor-default items-center justify-center overflow-hidden rounded-md border border-transparent font-medium
    whitespace-nowrap transition-[color] select-none
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
        default: 'bg-muted text-muted-foreground',
        primary: 'bg-primary text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
        brand: 'border-brand bg-brand text-brand-foreground',
        'brand.accent': 'border-brand-accent bg-brand-accent text-brand-foreground',
        'brand-secondary':
          'border-brand-secondary bg-brand-secondary text-brand-secondary-foreground [a&]:hover:bg-brand-secondary/90',
        'brand-secondary.accent':
          'border-brand-secondary-accent bg-brand-secondary-accent text-brand-secondary-foreground',
        'brand-tertiary':
          'border-brand-tertiary bg-brand-tertiary text-brand-tertiary-foreground [a&]:hover:bg-brand-tertiary/90',
        'brand-tertiary.accent': 'border-brand-tertiary-accent bg-brand-tertiary-accent text-brand-tertiary-foreground',
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
      },
      size: {
        xs: 'gap-0.5 px-1 py-[1px] text-[10px]',
        sm: 'gap-1 px-2 py-0.5 text-xs',
        md: 'gap-1.5 px-2.5 py-1 text-sm',
        lg: 'gap-2 px-3 py-1.5 text-base',
      },
      variant: {
        default: '',
        outline: '!bg-transparent border',
        ghost: 'bg-transparent text-foreground',
      },
    },
    compoundVariants: [
      {
        color: 'default',
        variant: 'outline',
        className: 'border-muted-foreground/50 bg-transparent text-muted-foreground/80',
      },
      {
        color: 'primary',
        variant: 'outline',
        className: 'border-foreground/50 bg-transparent text-foreground/80',
      },
      {
        color: 'brand',
        variant: 'outline',
        className: 'border-brand/80 bg-transparent text-brand',
      },
      {
        color: 'brand-secondary',
        variant: 'outline',
        className: 'border-brand-secondary/80 bg-transparent text-brand-secondary',
      },
      {
        color: 'destructive',
        variant: 'outline',
        className: 'border-destructive/50 bg-transparent text-destructive/80',
      },
      {
        color: 'brand.accent',
        variant: 'outline',
        className: 'border-brand-accent/80 bg-transparent text-brand-accent',
      },
      {
        color: 'brand-secondary.accent',
        variant: 'outline',
        className: 'border-brand-secondary-accent/80 bg-transparent text-brand-secondary-accent',
      },
    ],
  }
)
