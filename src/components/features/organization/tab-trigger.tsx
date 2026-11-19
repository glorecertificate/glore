'use client'

import { TabsTrigger } from '@/components/ui/tabs'

import { preloadOrganizationTab } from './lazy-tabs'
import { useOrganizationTab } from './tab-context'

export const OrganizationTabTrigger = ({
  value,
  ...props
}: React.ComponentProps<typeof TabsTrigger> & { value: string }) => {
  const { scope } = useOrganizationTab()
  const warm = () => {
    if (scope) void preloadOrganizationTab(value, scope)
  }

  return <TabsTrigger onFocus={warm} onPointerDown={warm} onPointerEnter={warm} value={value} {...props} />
}
