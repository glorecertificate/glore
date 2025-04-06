'use client'

import NextLink, { type LinkProps as NextLinkProps } from 'next/link'
import { useMemo } from 'react'

import { cva, type VariantProps } from 'class-variance-authority'

import { type HTTPUrl } from '@repo/utils'

import { type DynamicRoute, type Route } from '@/lib/navigation'

export interface LinkBaseProps extends React.PropsWithChildren<NextLinkProps>, VariantProps<typeof link> {
  className?: string
  href: HTTPUrl
  target?: string
}

export interface LinkProps extends Omit<LinkBaseProps, 'href'> {
  href: Route | DynamicRoute
  title?: string
}

export const Link = ({ className, color, href, variant, ...props }: LinkProps) => {
  const external = useMemo(() => !href.startsWith('/'), [href])
  const styles = useMemo(() => link({ className, color, variant }), [className, color, variant])

  if (external) return <a className={styles} href={href} {...props} />

  return <NextLink className={styles} href={href} {...props} />
}

export const ExternalLink = ({ href, target = '_blank', ...props }: LinkBaseProps) => (
  <Link href={href as Route} target={target} {...props} />
)

export const link = cva(`text-sm no-underline transition-all`, {
  defaultVariants: {
    color: 'default',
  },
  variants: {
    color: {
      default: 'text-foreground',
      primary: 'text-primary hover:text-primary-accent',
      secondary: 'text-secondary hover:text-secondary-accent',
      tertiary: 'text-tertiary hover:text-tertiary-accent',
      destructive: 'hover:text-destructive-accent text-destructive',
      transparent: 'text-transparent hover:text-foreground',
      muted: 'text-muted hover:text-muted-foreground',
    },
    variant: {
      underline: 'underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none',
    },
  },
})
