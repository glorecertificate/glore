'use client'

import { Badge } from '@/components/ui/badge'
import { useSidebar } from '@/components/ui/sidebar'

export const SidebarCount = ({ count, label }: { count: number; label: string }) => {
  const { isMobile, open } = useSidebar()

  if (!open && !isMobile) {
    return (
      <span className="absolute top-0.5 right-0.5 size-2 rounded-full bg-sidebar-badge ring-2 ring-sidebar">
        <span className="sr-only">{label}</span>
      </span>
    )
  }

  return (
    <Badge className="ml-auto bg-sidebar-badge text-sidebar-badge-foreground" count={count} size="sm" variant="ghost">
      <span className="sr-only">{label}</span>
    </Badge>
  )
}
