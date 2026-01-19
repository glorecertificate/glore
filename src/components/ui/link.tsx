'use client'

import NextLink, { type LinkProps as NextLinkProps } from 'next/link'

import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

export type LinkProps<T> = NextLinkProps<T> & VariantProps<typeof linkVariants>

export const Link = <T,>({ className, variant, ...props }: LinkProps<T>) => (
  <NextLink className={cn(linkVariants({ variant }), className)} {...props} />
)

const linkVariants = cva('cursor-pointer no-underline transition-all', {
  defaultVariants: {
    variant: null,
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
      underlined: 'underline-offset-2 hover:underline',
    },
  },
})
