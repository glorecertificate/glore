'use client'

import NextLink, { type LinkProps as NextLinkProps } from 'next/link'
import { startTransition, useCallback, useMemo } from 'react'

import { cva, type VariantProps } from 'class-variance-authority'

import { useProgressBar, type ProgressBarProps } from '@/components/ui/progress-bar'
import { useNavigation } from '@/hooks/use-navigation'
import { type AnyUrl, type ExternalUrl, type Routes } from '@/lib/navigation'
import { cn } from '@/lib/utils'

type MappedLinkProps<T extends AnyUrl> = {
  [K in keyof Omit<NextLinkProps, keyof React.AnchorHTMLAttributes<HTMLAnchorElement>>]: T extends ExternalUrl
    ? never
    : NextLinkProps[K]
}

export interface LinkProps<T extends AnyUrl>
  extends React.AnchorHTMLAttributes<HTMLAnchorElement>,
    VariantProps<typeof linkVariants>,
    MappedLinkProps<T> {
  href: T
  /** @default true */
  progress?: T extends ExternalUrl ? never : boolean | Exclude<ProgressBarProps['variant'], undefined | null>
}

export const Link = <T extends Routes | ExternalUrl>({ progress, underline, variant, ...props }: LinkProps<T>) => {
  const { className, onClick, ...nextLinkProps } = props

  const progressBar = useProgressBar()
  const { router } = useNavigation()

  const external = useMemo(() => !(props.href.startsWith('/') || props.href.startsWith('#')), [props.href])
  const hasProgress = useMemo(() => !(external || progress), [external, progress])

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault()

      if (hasProgress && progressBar.state !== 'in-progress') {
        if (variant) progressBar.colorize(variant)
        progressBar.start()

        startTransition(() => {
          router.push(props.href)
          progressBar.done()
        })
      }

      onClick?.(e)
    },
    [hasProgress, onClick, progressBar, props.href, router, variant]
  )

  return external ? (
    <a className={cn(linkVariants({ variant, underline }), className)} {...props} />
  ) : (
    <NextLink
      className={cn(linkVariants({ variant, underline }), className)}
      onClick={handleClick}
      {...nextLinkProps}
    />
  )
}

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
      true: 'underline-offset-2 hover:underline',
    },
  },
})
