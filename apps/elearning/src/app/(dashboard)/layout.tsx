import { cookies } from 'next/headers'

import api from '@/api'
import { AppHeader } from '@/components/layout/app-header'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { DashboardProvider } from '@/components/providers/dashboard-provider'
import { NavigationProvider } from '@/components/providers/navigation-provider'
import { ProgressBar, ProgressBarProvider } from '@/components/ui/progress-bar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { getRoutes } from '@/lib/navigation'
import { Cookie } from '@/lib/storage'

export default async ({ children }: React.PropsWithChildren) => {
  const routes = await getRoutes()
  const user = await api.users.fetchCurrent()
  const modules = await api.modules.fetchAll()

  const { get } = await cookies()
  const sidebarOpen = get(Cookie.SidebarOpen)?.value === 'true'

  return (
    <NavigationProvider value={{ routes }}>
      <DashboardProvider value={{ modules, user }}>
        <ProgressBarProvider>
          <ProgressBar />
          <SidebarProvider defaultOpen={sidebarOpen}>
            <AppSidebar />
            <SidebarInset>
              <AppHeader className="sticky top-0 z-5" />
              <main className="min-h-[calc(100vh-4rem)] px-8">{children}</main>
            </SidebarInset>
          </SidebarProvider>
        </ProgressBarProvider>
      </DashboardProvider>
    </NavigationProvider>
  )
}
