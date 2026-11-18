'use client'

import { useMenuIndicator } from '@/components/layout/use-menu-indicator'
import { HeaderTrigger } from '@/components/ui/header'

export const DashboardMenuButton = (props: React.ComponentProps<typeof HeaderTrigger>) => {
  const indicator = useMenuIndicator()

  return <HeaderTrigger {...indicator} {...props} />
}
