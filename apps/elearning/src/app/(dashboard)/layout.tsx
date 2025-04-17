import { cookies } from 'next/headers'

import { getModules } from '@/api/modules'
import { fetchCurrentUser } from '@/api/users'
import { AppHeader } from '@/components/layout/app-header'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { RouteListener } from '@/components/layout/route-listener'
import { DashboardProvider } from '@/components/providers/dashboard-provider'
import { HeaderProvider } from '@/components/providers/header-provider'
import { SyncStatusProvider } from '@/components/providers/sync-status-provider'
import { ProgressBar } from '@/components/ui/progress-bar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Cookie } from '@/lib/storage'

export default async ({ children }: React.PropsWithChildren) => {
  const user = await fetchCurrentUser()
  const modules = await getModules({ userId: user.id })

  const { get } = await cookies()
  const sidebarOpen = get(Cookie.SidebarOpen)?.value === 'true'

  return (
    <SyncStatusProvider>
      <DashboardProvider modules={modules} user={user}>
        <SidebarProvider defaultOpen={sidebarOpen}>
          <HeaderProvider>
            <RouteListener />
            <ProgressBar />
            <AppSidebar />
            <SidebarInset>
              <AppHeader className="sticky top-0 z-5" />
              <main className="min-h-[calc(100vh-72px)]">{children}</main>
            </SidebarInset>
          </HeaderProvider>
        </SidebarProvider>
      </DashboardProvider>
    </SyncStatusProvider>
  )
}
