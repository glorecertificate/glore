'use client'

import { startTransition, useCallback } from 'react'
import NextLink, { type LinkProps as NextLinkProps } from 'next/link'
import { useRouter } from 'next/navigation'
import { type AppRoutes } from 'next/types/routes'

import { cva, type VariantProps } from 'class-variance-authority'

import { type ProgressBarVariant, useProgressBar } from '@/components/ui/progress-bar'
import { cn } from '@/lib/utils'

export interface LinkProps<T>
  extends Omit<React.ComponentProps<typeof NextLink>, 'href'>,
    NextLinkProps<T>,
    VariantProps<typeof linkVariants> {
  /**
   * Enable progress bar on internal navigation.
   * @default true
   */
  progress?: boolean | ProgressBarVariant
}

export const Link = <T,>({ className, href, onClick, progress = true, variant, ...props }: LinkProps<T>) => {
  const progressBar = useProgressBar()
  const router = useRouter()

  const onLinkClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault()

      const colorVariant = typeof progress === 'string' ? progress : variant
      if (colorVariant) progressBar.colorize(colorVariant)
      if (progressBar.state !== 'in-progress') progressBar.start()

      startTransition(() => {
        router.push(href as AppRoutes)
        progressBar.done()
      })

      onClick?.(e)
    },
    [href, onClick, progress, progressBar, router, variant]
  )

  return <NextLink className={cn(linkVariants({ variant }), className)} href={href} onClick={onLinkClick} {...props} />
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
