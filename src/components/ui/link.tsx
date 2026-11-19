'use client'

import NextLink, { type LinkProps as NextLinkProps } from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

import { type VariantProps, cva } from 'class-variance-authority'

import { prefetchFull, keepFresh as registerFresh } from '@/lib/prefetch'
import { cn } from '@/lib/utils'

const INTENT_DELAY_MS = 60

export type LinkProps<T> = NextLinkProps<T> & VariantProps<typeof linkVariants> & { keepFresh?: boolean | 'list' }

export const Link = <T,>({
  className,
  href,
  keepFresh,
  onFocus,
  onPointerEnter,
  onPointerLeave,
  onTouchStart,
  prefetch,
  variant,
  ...props
}: LinkProps<T>) => {
  const router = useRouter()
  const timer = useRef(0)
  const path = typeof href === 'string' && href.startsWith('/') ? href : null

  useEffect(
    () => (keepFresh && path ? registerFresh(path, keepFresh === 'list' ? 'list' : 'nav') : undefined),
    [keepFresh, path]
  )

  const clear = () => window.clearTimeout(timer.current)

  const schedule = (delay: number) => {
    if (!path || prefetch === false) return
    clear()
    timer.current = window.setTimeout(() => prefetchFull(router, path), delay)
  }

  return (
    <NextLink
      className={cn(linkVariants({ variant }), className)}
      href={href}
      onFocus={e => {
        schedule(0)
        onFocus?.(e)
      }}
      onPointerEnter={e => {
        schedule(INTENT_DELAY_MS)
        onPointerEnter?.(e)
      }}
      onPointerLeave={e => {
        clear()
        onPointerLeave?.(e)
      }}
      onTouchStart={e => {
        schedule(0)
        onTouchStart?.(e)
      }}
      prefetch={prefetch}
      {...props}
    />
  )
}

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
