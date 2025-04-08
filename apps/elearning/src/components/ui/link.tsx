'use client'

import NextLink, { type LinkProps as NextLinkProps } from 'next/link'
import { useRouter } from 'next/navigation'
import { startTransition, useCallback, useMemo } from 'react'

import { cva, type VariantProps } from 'class-variance-authority'

import { type HTTPUrl } from '@repo/utils'

import { useProgressBar } from '@/hooks/use-progress-bar'
import { type Pathname } from '@/lib/navigation'

export interface LinkProps<T extends boolean = false> extends React.PropsWithChildren<NextLinkProps>, VariantProps<typeof link> {
  className?: string
  external?: T
  hideProgress?: T extends true ? never : boolean
  href: T extends true ? HTTPUrl : Pathname
  target?: T extends true ? React.HTMLAttributeAnchorTarget : undefined
  title?: string
}

export const Link = <T extends boolean = false>({
  className,
  color,
  external,
  hideProgress,
  href,
  onClick,
  target,
  variant,
  ...props
}: LinkProps<T>) => {
  const router = useRouter()
  const progressBar = useProgressBar()

  const styles = useMemo(() => link({ className, color, variant }), [className, color, variant])
  const hasProgress = useMemo(() => !external && !hideProgress, [external, hideProgress])

  const handleInternalClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault()

      if (hasProgress && progressBar.state !== 'in-progress') {
        progressBar.colorize(color)
        progressBar.start()

        startTransition(() => {
          router.push(href)
          progressBar.done()
        })
      }

      if (onClick) onClick(e)
    },
    [color, hasProgress, href, onClick, progressBar, router],
  )

  if (external) return <a className={styles} href={href} onClick={onClick} target={target} {...props} />

  return <NextLink className={styles} href={href} onClick={handleInternalClick} {...props} />
}

export const link = cva(`text-sm no-underline transition-all`, {
  defaultVariants: {
    color: 'default',
    variant: null,
  },
  variants: {
    color: {
      default: 'text-current',
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
