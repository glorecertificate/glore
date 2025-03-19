'use client'

import NextLink, { type LinkProps as NextLinkProps } from 'next/link'
import { useMemo } from 'react'

import { type Route } from '@/lib/navigation'
import { cn, tw } from '@/lib/utils'

export interface LinkProps extends React.PropsWithChildren<NextLinkProps> {
  className?: string
  href: Route | `${Route}/${string}` | `http${string}`
  target?: string
  title?: string
}

export const Link = ({ className, href, ...props }: LinkProps) => {
  const external = useMemo(() => !href.startsWith('/'), [href])

  if (external) return <a className={cn(link, className)} href={href} {...props} />
  return <NextLink className={cn(link, className)} href={href} {...props} />
}

export const link = tw`text-sm underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none`
