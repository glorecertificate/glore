'use client'

import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

export const Badge = ({
  asChild = false,
  className,
  color,
  variant,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badge> & { asChild?: boolean }) => {
  const Comp = asChild ? Slot : 'span'
  return <Comp className={cn(badge({ color, variant }), className)} data-slot="badge" {...props} />
}

export const badge = cva(
  `
    inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-md border border-transparent px-2 py-0.5 text-xs font-medium
    whitespace-nowrap transition-[color,box-shadow]
    focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50
    aria-invalid:border-destructive aria-invalid:ring-destructive/20
    dark:aria-invalid:ring-destructive/40
    [&>svg]:pointer-events-none [&>svg]:size-3
  `,
  {
    defaultVariants: {
      color: 'default',
      variant: 'default',
    },
    variants: {
      color: {
        default: 'border-foreground text-foreground',
        primary: 'border-primary bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
        'primary.accent':
          'border-primary-accent bg-primary-accent text-primary-foreground [a&]:hover:bg-primary-accent/90',
        secondary: 'border-secondary bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90',
        'secondary.accent':
          'border-secondary-accent bg-secondary-accent text-secondary-foreground [a&]:hover:bg-secondary-accent/90',
        destructive: `
          border-destructive bg-destructive text-white
          focus-visible:ring-destructive/20
          dark:bg-destructive/70 dark:focus-visible:ring-destructive/40
          [a&]:hover:bg-destructive/90
        `,
        muted: 'bg-muted text-muted-foreground [a&]:hover:bg-muted/90',
      },
      variant: {
        default: '',
        outline: 'border !bg-transparent',
        ghost: 'bg-transparent text-foreground [a&]:hover:bg-muted/90',
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
