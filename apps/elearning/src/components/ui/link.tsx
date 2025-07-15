'use client'

import NextLink, { type LinkProps as NextLinkProps } from 'next/link'
import { useRouter } from 'next/navigation'
import { startTransition, useCallback, useMemo } from 'react'

import { cva, type VariantProps } from 'class-variance-authority'

import { type HTTPUrl, type MailToUrl, type TelUrl } from '@repo/utils'

import { useProgressBar } from '@/components/ui/progress-bar'
import { usePathname } from '@/hooks/use-pathname'
import { type Pathname } from '@/lib/navigation'
import { cn } from '@/lib/utils'

export type AllowedUrl = Pathname | HTTPUrl | MailToUrl | TelUrl

export interface LinkProps<T extends AllowedUrl = Pathname>
  extends React.PropsWithChildren<NextLinkProps>,
    VariantProps<typeof link> {
  className?: string
  hideProgress?: T extends Pathname ? boolean : never
  href: T
  target?: T extends Pathname | MailToUrl | TelUrl ? undefined : React.HTMLAttributeAnchorTarget
  title?: string
}

export const Link = <T extends AllowedUrl>({
  className,
  color,
  hideProgress,
  href,
  onClick,
  size,
  target,
  variant,
  ...props
}: LinkProps<T>) => {
  const progressBar = useProgressBar()
  const { setPathname } = usePathname()
  const router = useRouter()

  const styles = useMemo(() => cn(link({ color, variant, size }), className), [className, color, size, variant])
  const external = useMemo(() => !href.startsWith('/') && !href.startsWith('#'), [href])
  const hasProgress = useMemo(() => !external && !hideProgress, [external, hideProgress])

  const handleInternalClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault()

      if (hasProgress && progressBar.state !== 'in-progress') {
        progressBar.colorize(color)
        progressBar.start()

        startTransition(() => {
          router.push(href)
          setPathname(href as Pathname)
          progressBar.done()
        })
      }

      if (onClick) onClick(e)
    },
    [color, hasProgress, href, onClick, progressBar, router, setPathname],
  )

  if (external) return <a className={styles} href={href} onClick={onClick} target={target} {...props} />

  return <NextLink className={styles} href={href} onClick={handleInternalClick} {...props} />
}

export const link = cva('transition-all', {
  defaultVariants: {
    color: 'default',
    variant: 'default',
    size: 'md',
  },
  variants: {
    color: {
      default: 'text-current',
      primary: 'text-primary hover:text-primary-accent',
      secondary: 'text-secondary hover:text-secondary-accent',
      tertiary: 'text-tertiary hover:text-tertiary-accent',
      destructive: 'text-destructive hover:text-destructive',
      success: 'text-success hover:text-success',
      transparent: 'text-transparent hover:text-foreground',
      muted: 'text-muted hover:text-muted-foreground',
    },
    variant: {
      default: 'no-underline',
      underline: 'hover:underline',
    },
    size: {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    },
  },
})
