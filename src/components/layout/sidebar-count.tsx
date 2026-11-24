'use client'

import { Badge } from '@/components/ui/badge'
import { useSidebar } from '@/components/ui/sidebar'

export const SidebarCount = ({
  count,
  floating = false,
  label,
}: {
  count: number
  floating?: boolean
  label: string
}) => {
  const { isMobile, open } = useSidebar()

  if (!open && !isMobile) {
    return (
      <span className="absolute top-0.5 right-0.5 size-2 rounded-full bg-sidebar-badge ring-2 ring-sidebar">
        <span className="sr-only">{label}</span>
      </span>
    )
  }

  if (floating) {
    return (
      <Badge
        className="absolute -top-px -right-px bg-destructive text-destructive-foreground"
        count={count}
        size="sm"
        variant="ghost"
      >
        <span className="sr-only">{label}</span>
      </Badge>
    )
  }

  return (
    <span className="ml-auto text-xs font-medium text-sidebar-muted tabular-nums in-data-active:text-sidebar-accent-foreground">
      <span aria-hidden>{count > 99 ? '99+' : count}</span>
      <span className="sr-only">{label}</span>
    </span>
  )
}
