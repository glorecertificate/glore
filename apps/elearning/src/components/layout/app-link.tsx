'use client'

import { useRouter } from 'next/navigation'
import { startTransition, useCallback } from 'react'

import { Link, type LinkProps } from '@/components/ui/link'
import { ProgressBarState } from '@/components/ui/progress-bar'
import { useProgressBar } from '@/hooks/use-progress-bar'
import { type Path } from '@/lib/navigation'
import { type ColorVariant } from '@/lib/theme'

export const AppLink = ({
  children,
  color,
  onClick,
  to,
  ...props
}: Omit<LinkProps, 'href'> & {
  color?: ColorVariant
  to: Path
}) => {
  const router = useRouter()
  const progressBar = useProgressBar()

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault()

      if (progressBar.state === ProgressBarState.InProgress) {
        return
      }

      progressBar.colorize(color)
      progressBar.start()

      startTransition(() => {
        router.push(to)
        progressBar.done()
      })

      if (onClick) onClick(e)
    },
    [color, onClick, progressBar, router, to],
  )

  return (
    <Link href={to} onClick={handleClick} {...props}>
      {children}
    </Link>
  )
}
