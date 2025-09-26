import { ProgressBar } from '@repo/ui/components/progress-bar'
import { SidebarInset, SidebarProvider } from '@repo/ui/components/sidebar'

import { AppHeader } from '@/components/layout/app-header'
import { AppMain } from '@/components/layout/app-main'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { RouteListener } from '@/components/layout/route-listener'
import { HeaderProvider } from '@/components/providers/header-provider'
import { SessionProvider } from '@/components/providers/session-provider'
import { SyncStateProvider } from '@/components/providers/sync-state-provider'
import { createApi } from '@/lib/api/ssr'
import { redirect } from '@/lib/navigation'
import { deleteCookie, getCookie, hasCookie } from '@/lib/storage/ssr'

export default async ({ children }: LayoutProps<'/'>) => {
  const api = await createApi()
  const user = await api.users.getCurrent()

  if (!user) {
    if (await hasCookie('user')) {
      await deleteCookie('user')
    }
    redirect('/login')
  }

  const courses = await api.courses.list()

  const orgCookie = await getCookie('org')
  const organization = orgCookie ? user.organizations.find(({ id }) => id === orgCookie) : user.organizations?.[0]

  const sidebarOpen = (await getCookie('sidebar-open')) ?? true

  return (
    <SessionProvider courses={courses} organization={organization} user={user}>
      <SyncStateProvider>
        <SidebarProvider defaultOpen={sidebarOpen}>
          <HeaderProvider>
            <RouteListener />
            <ProgressBar />
            <AppSidebar />
            <SidebarInset>
              <AppHeader />
              <AppMain>{children}</AppMain>
            </SidebarInset>
          </HeaderProvider>
        </SidebarProvider>
      </SyncStateProvider>
    </SessionProvider>
  )
}
