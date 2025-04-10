import { cookies } from 'next/headers'

import api from '@/api'
import { AppHeader } from '@/components/layout/app-header'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { RouteChangeListener } from '@/components/layout/route-change-listener'
import { DashboardProvider } from '@/components/providers/dashboard-provider'
import { BreadcrumbProvider } from '@/components/ui/breadcrumb'
import { ProgressBar } from '@/components/ui/progress-bar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Cookie } from '@/lib/storage'

export default async ({ children }: React.PropsWithChildren) => {
  const user = await api.users.fetchCurrent()
  const modules = await api.modules.fetchAll()

  const { get } = await cookies()
  const sidebarOpen = get(Cookie.SidebarOpen)?.value === 'true'

  return (
    <DashboardProvider value={{ modules, user }}>
      <SidebarProvider defaultOpen={sidebarOpen}>
        <BreadcrumbProvider>
          <RouteChangeListener />
          <ProgressBar />
          <AppSidebar />
          <SidebarInset>
            <AppHeader className="sticky top-0 z-5" />
            <main className="min-h-[calc(100vh-4rem)] px-8">{children}</main>
          </SidebarInset>
        </BreadcrumbProvider>
      </SidebarProvider>
    </DashboardProvider>
  )
}
