'use client'

import NextLink, { type LinkProps as NextLinkProps } from 'next/link'
import { startTransition, useCallback, useMemo } from 'react'

import { Link as BaseLink, linkVariants, type LinkProps as BaseLinkProps } from '@repo/ui/components/link'
import { useProgressBar, type ProgressBarProps } from '@repo/ui/components/progress-bar'
import { cn } from '@repo/ui/utils'

import { useNavigation } from '@/hooks/use-navigation'
import { type AnyUrl, type ExternalUrl, type Routes } from '@/lib/navigation'

type MappedLinkProps<T extends AnyUrl> = {
  [K in keyof Omit<NextLinkProps, keyof React.AnchorHTMLAttributes<HTMLAnchorElement>>]: T extends ExternalUrl
    ? never
    : NextLinkProps[K]
}

export interface LinkProps<T extends AnyUrl> extends BaseLinkProps, MappedLinkProps<T> {
  href: T
  /** @default true */
  progress?: T extends ExternalUrl ? never : boolean | Exclude<ProgressBarProps['variant'], undefined | null>
}

export const Link = <T extends Routes | ExternalUrl>({ progress, ...props }: LinkProps<T>) => {
  const { className, onClick, underline, variant, ...nextLinkProps } = props

  const progressBar = useProgressBar()
  const { router } = useNavigation()

  const external = useMemo(() => !props.href.startsWith('/') && !props.href.startsWith('#'), [props.href])
  const hasProgress = useMemo(() => !external && !progress, [external, progress])

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
    [hasProgress, onClick, progressBar, props.href, router, variant],
  )

  return external ? (
    <BaseLink {...props} />
  ) : (
    <NextLink
      className={cn(linkVariants({ variant, underline }), className)}
      onClick={handleClick}
      {...nextLinkProps}
    />
  )
}
