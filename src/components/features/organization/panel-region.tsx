'use client'

import { useOrganizationTab } from './tab-context'

export const OrganizationPanelRegion = ({ children }: React.PropsWithChildren) => {
  const { pending } = useOrganizationTab()

  return (
    <div aria-busy={pending || undefined} role="tabpanel">
      {children}
    </div>
  )
}
