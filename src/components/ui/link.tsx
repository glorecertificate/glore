'use client'

import NextLink, { type LinkProps as NextLinkProps } from 'next/link'

import { type VariantProps, cva } from 'class-variance-authority'

import { cn } from '@/lib/utils'

export type LinkProps<T> = NextLinkProps<T> & VariantProps<typeof linkVariants>

export const Link = <T,>({ className, variant, ...props }: LinkProps<T>) => (
  <NextLink className={cn(linkVariants({ variant }), className)} {...props} />
)

const linkVariants = cva('cursor-pointer no-underline transition-colors', {
  defaultVariants: {
    variant: null,
  },
  variants: {
    variant: {
      destructive: 'text-destructive-text hover:text-destructive-text',
      link: 'text-link',
      muted: 'text-muted-foreground hover:text-foreground/90',
      primary: 'text-brand-text hover:text-brand-text/80',
      secondary: 'text-brand-secondary-text hover:text-brand-secondary-text/80',
      success: 'text-success-text hover:text-success-text',
      tertiary: 'text-brand-tertiary-text hover:text-brand-tertiary-text/80',
      transparent: 'text-transparent hover:text-foreground',
      underlined: 'underline-offset-2 hover:underline',
    },
  },
})
