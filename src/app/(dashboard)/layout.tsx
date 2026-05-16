import { Suspense } from 'react'

import { cookies } from '@/actions/cookies'
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { SessionProvider } from '@/components/providers/session-provider'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

const DashboardLayout = async ({ children }: LayoutProps<'/'>) => {
  const { get } = await cookies()
  const sidebarOpen = get('sidebarOpen')
  const sidebarWidth = get('sidebarWidth')

  return (
    <Suspense fallback={<LoadingFallback size="full" />}>
      <SidebarProvider defaultOpen={sidebarOpen} defaultWidth={sidebarWidth}>
        <SessionProvider>
          <DashboardSidebar />
          <SidebarInset>{children}</SidebarInset>
        </SessionProvider>
      </SidebarProvider>
    </Suspense>
  )
}

export default DashboardLayout
