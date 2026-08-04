import { Suspense } from 'react'

import { getPendingCounts } from '@/actions/admin/pending'
import { cookies } from '@/actions/cookies'
import { getCurrentUser } from '@/actions/user'
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { SessionProvider } from '@/components/providers/session'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

const DashboardLayoutContent = async ({ children }: React.PropsWithChildren) => {
  const [user, { get }, pending] = await Promise.all([getCurrentUser(), cookies(), getPendingCounts()])
  const org = get('org')
  const organizationId = org ? user.organizations.find(({ id }) => id === org)?.id : user.organizations[0]?.id
  const sidebarOpen = get('sidebarOpen')
  const sidebarWidth = get('sidebarWidth')

  return (
    <SidebarProvider defaultOpen={sidebarOpen} defaultWidth={sidebarWidth}>
      <SessionProvider user={user} organizationId={organizationId}>
        <DashboardSidebar pending={pending} />
        <SidebarInset>{children}</SidebarInset>
      </SessionProvider>
    </SidebarProvider>
  )
}

const DashboardLayout = ({ children }: LayoutProps<'/'>) => (
  <Suspense fallback={<LoadingFallback size="full" />}>
    <DashboardLayoutContent>{children}</DashboardLayoutContent>
  </Suspense>
)

export default DashboardLayout
