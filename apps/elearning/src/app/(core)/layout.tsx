import { AppHeader } from '@/components/layout/app-header'
import { AppMain } from '@/components/layout/app-main'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { RouteListener } from '@/components/layout/route-listener'
import { HeaderProvider } from '@/components/providers/header-provider'
import { SessionProvider } from '@/components/providers/session-provider'
import { SyncStateProvider } from '@/components/providers/sync-state-provider'
import { ProgressBar } from '@/components/ui/progress-bar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { redirect } from '@/lib/navigation'
import { createApiClient, createCookieStore, getCurrentUser } from '@/lib/server'

export default async ({ children }: LayoutProps<'/'>) => {
  const api = await createApiClient()
  const cookies = await createCookieStore()
  const user = await getCurrentUser()

  if (!user) {
    if (await cookies.has('user')) {
      await cookies.delete('user')
    }
    redirect('/login')
  }

  const courses = await api.courses.list()

  const orgCookie = await cookies.get('org')
  const organization = orgCookie ? user.organizations.find(({ id }) => id === orgCookie) : user.organizations?.[0]

  const sidebarOpen = (await cookies.get('sidebar-open')) ?? true

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
