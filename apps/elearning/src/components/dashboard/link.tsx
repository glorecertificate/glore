'use client'

import { useRouter } from 'next/navigation'
import { startTransition, useCallback, useMemo, useState } from 'react'

import { LoaderIcon } from 'lucide-react'

import { Link, type LinkProps } from '@/components/ui/link'
import { type Page } from '@/hooks/use-navigation'
import { useProgressBar } from '@/hooks/use-progress-bar'
import { type Route } from '@/lib/routes'
import { type SemanticColor } from '@/lib/theme'
import { cn } from '@/lib/utils'

export interface DashboardLinkProps extends Omit<LinkProps, 'href'>, Partial<Page> {
  color?: SemanticColor
  iconSize?: number
  loader?: boolean
  to: Route
}

export const DashboardLink = ({
  children,
  className,
  color,
  iconSize,
  loader,
  onClick,
  subPages,
  to,
  ...props
}: DashboardLinkProps) => {
  const router = useRouter()
  const progressBar = useProgressBar()

  const [loading, setLoading] = useState(false)
  const showLoader = useMemo(() => loader && loading, [loader, loading])

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault()

      setLoading(true)
      progressBar.colorize(color)
      progressBar.start()

      startTransition(() => {
        router.push(to as string)
        progressBar.done()
        setLoading(false)
      })

      if (onClick) onClick(e)
    },
    [color, onClick, progressBar, router, to],
  )

  return (
    <Link className={cn('hover:no-underline', className)} href={to} onClick={handleClick} {...props}>
      {children}
      {showLoader && <LoaderIcon className="animate-spin text-foreground/35" size={iconSize} />}
    </Link>
  )
}
