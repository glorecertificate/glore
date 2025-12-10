'use client'

import NextLink, { type LinkProps as NextLinkProps } from 'next/link'
import { useRouter } from 'next/navigation'
import { startTransition, useCallback } from 'react'

import { cva, type VariantProps } from 'class-variance-authority'

import type { Any } from '@glore/utils/types'

import { type ProgressBarProps, useProgressBar } from '@/components/ui/progress-bar'
import { INTERNAL_URL_REGEX } from '@/lib/constants'
import { cn } from '@/lib/utils'

export interface LinkProps<T, V extends boolean>
  extends Omit<NextLinkProps<T>, 'href'>,
    VariantProps<typeof linkVariants> {
  /**
   * The destination URL.
   */
  href: V extends true ? NextLinkProps<T>['href'] : string
  /**
   * Enable progress bar on internal navigation.
   * @default true
   */
  progress?: boolean | ProgressBarProps['variant']
  /**
   * Statically validate the `href` prop before rendering the link.
   */
  validate?: V
}

export const Link = <T, V extends boolean = true>({
  className,
  href,
  onClick,
  progress = true,
  variant,
  validate,
  ...props
}: LinkProps<T, V>) => {
  const progressBar = useProgressBar()
  const router = useRouter()

  const onLinkClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault()

      const colorVariant = typeof progress === 'string' ? progress : variant
      if (colorVariant && colorVariant !== 'underlined') progressBar.colorize(colorVariant)
      if (progressBar.state !== 'in-progress') progressBar.start()

      startTransition(() => {
        router.push(href as Any)
        progressBar.done()
      })

      onClick?.(e)
    },
    [href, onClick, progress, progressBar, router, variant]
  )

  if (INTERNAL_URL_REGEX.test(href.toString()))
    return (
      <NextLink
        className={cn(linkVariants({ variant }), className)}
        href={href as NextLinkProps<T>['href']}
        onClick={onLinkClick}
        {...props}
      />
    )

  return <a className={cn(linkVariants({ variant }), className)} href={href.toString()} onClick={onClick} {...props} />
}

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
