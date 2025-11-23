'use client'

import NextLink, { type LinkProps as NextLinkProps } from 'next/link'
import { useRouter } from 'next/navigation'
import { startTransition, useCallback } from 'react'

import { cva, type VariantProps } from 'class-variance-authority'

import { type Any, type Enum, type HTTPUrl, type MailToUrl } from '@glore/utils/types'

import { type ProgressBarProps, useProgressBar } from '@/components/ui/progress-bar'
import { type ExternalRoute } from '@/lib/navigation'
import { cn } from '@/lib/utils'

export interface LinkProps<T> extends NextLinkProps<T>, VariantProps<typeof linkVariants> {
  className?: string
  /** @default true */
  progress?: boolean | Exclude<ProgressBarProps['variant'], undefined | null>
}

export const Link = <T,>({ className, onClick, progress, variant, ...props }: LinkProps<T>) => {
  const progressBar = useProgressBar()
  const router = useRouter()

  const onLinkClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (progress === false) return onClick?.(e)

      e.preventDefault()

      const colorVariant = typeof progress === 'string' ? progress : variant

      if (colorVariant && colorVariant !== 'underlined') progressBar.colorize(colorVariant)
      if (progressBar.state !== 'in-progress') progressBar.start()

      startTransition(() => {
        router.push(props.href as Any)
        progressBar.done()
      })

      onClick?.(e)
    },
    [onClick, progress, progressBar, props.href, router, variant]
  )

  return <NextLink className={cn(linkVariants({ variant }), className)} onClick={onLinkClick} {...props} />
}

export interface ExternalLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement>,
    VariantProps<typeof linkVariants> {
  href: Enum<ExternalRoute> | HTTPUrl | MailToUrl
}

export const ExternalLink = ({ className, variant, ...props }: ExternalLinkProps) => (
  <a className={cn(linkVariants({ variant }), className)} {...props} />
)

export const linkVariants = cva('no-underline transition-all', {
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
