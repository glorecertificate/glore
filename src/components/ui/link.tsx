'use client'

import NextLink, { type LinkProps as NextLinkProps } from 'next/link'

import { type VariantProps, cva } from 'class-variance-authority'

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
      destructive: 'text-destructive hover:text-destructive',
      link: 'text-link',
      muted: 'text-muted-foreground hover:text-foreground/90',
      primary: 'text-brand hover:text-brand-accent',
      secondary: 'text-brand-secondary hover:text-brand-secondary-accent',
      success: 'text-success hover:text-success',
      tertiary: 'text-brand-tertiary hover:text-brand-tertiary-accent',
      transparent: 'text-transparent hover:text-foreground',
      underlined: 'underline-offset-2 hover:underline',
    },
  },
})
