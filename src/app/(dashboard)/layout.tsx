import { Suspense } from 'react'

import { cookies } from '@/actions/cookies'
import { getCurrentUser } from '@/actions/user'
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { SessionProvider } from '@/components/providers/session'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

const DashboardLayout = async ({ children }: LayoutProps<'/'>) => {
  const [user, { get }] = await Promise.all([getCurrentUser(), cookies()])
  const org = get('org')
  const organizationId = org ? user.organizations.find(({ id }) => id === org)?.id : user.organizations[0]?.id
  const sidebarOpen = get('sidebarOpen')
  const sidebarWidth = get('sidebarWidth')

  return (
    <Suspense fallback={<LoadingFallback size="full" />}>
      <SidebarProvider defaultOpen={sidebarOpen} defaultWidth={sidebarWidth}>
        <SessionProvider user={user} organizationId={organizationId}>
          <DashboardSidebar />
          <SidebarInset>{children}</SidebarInset>
        </SessionProvider>
      </SidebarProvider>
    </Suspense>
  )
}

export default DashboardLayout
