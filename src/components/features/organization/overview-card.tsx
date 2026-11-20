'use client'

import { Card, CardAction, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from '@/components/ui/link'
import { cn } from '@/lib/utils'

const ACTION_CLASS = 'inline-flex min-h-8 items-center text-sm font-medium'

export const OverviewCard = ({
  action,
  children,
  className,
  slot,
  title,
}: {
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  slot?: string
  title: string
}) => (
  <Card className={className} data-slot={slot}>
    <CardHeader className="items-center">
      <CardTitle>{title}</CardTitle>
      {action && <CardAction className="row-span-1 self-center">{action}</CardAction>}
    </CardHeader>
    {children}
  </Card>
)

export const OverviewAction = ({
  children,
  href,
  onClick,
}: {
  children: React.ReactNode
  href?: string
  onClick?: () => void
}) => {
  if (href) {
    return (
      <Link className={ACTION_CLASS} href={href as never} variant="primary">
        {children}
      </Link>
    )
  }
  return (
    <button
      className={cn(ACTION_CLASS, 'cursor-pointer text-brand-text transition-colors hover:text-brand-text/80')}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
}
