'use client'

import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@repo/ui/utils'

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement>, VariantProps<typeof linkVariants> {
  href: string
}

export const Link = ({ className, underline, variant, ...props }: LinkProps) => (
  <a className={cn(linkVariants({ underline, variant }), className)} {...props} />
)

export const linkVariants = cva('transition-all', {
  defaultVariants: {
    variant: null,
    underline: false,
  },
  variants: {
    variant: {
      link: 'text-link',
      primary: 'text-brand hover:text-brand-accent',
      secondary: 'text-brand-secondary hover:text-brand-secondary-accent',
      tertiary: 'text-brand-tertiary hover:text-brand-tertiary-accent',
      destructive: 'text-destructive hover:text-destructive',
      success: 'text-success hover:text-success',
      transparent: 'text-transparent hover:text-foreground',
      muted: 'text-muted-foreground hover:text-foreground/90',
    },
    underline: {
      false: 'no-underline',
      true: 'hover:underline underline-offset-2',
    },
  },
})
