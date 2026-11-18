'use client'

import { Badge } from '@/components/ui/badge'
import { useSidebar } from '@/components/ui/sidebar'

const MAX_COUNT = 99

export const SidebarCount = ({ count, label }: { count: number; label: string }) => {
  const { isMobile, open } = useSidebar()

  if (!open && !isMobile) {
    return (
      <span className="absolute top-0.5 right-0.5 size-2 rounded-full bg-brand ring-2 ring-sidebar">
        <span className="sr-only">{label}</span>
      </span>
    )
  }

  return (
    <Badge className="ml-auto h-4.5 min-w-4.5 rounded-full px-1 tabular-nums" size="sm" variant="brand">
      <span aria-hidden>{count > MAX_COUNT ? `${MAX_COUNT}+` : count}</span>
      <span className="sr-only">{label}</span>
    </Badge>
  )
}
