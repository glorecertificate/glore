import { redirect } from 'next/navigation'

import { getApi } from '@/api/client'
import { AppHeader } from '@/components/layout/app-header'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { RouteListener } from '@/components/layout/route-listener'
import { HeaderProvider } from '@/components/providers/header-provider'
import { SessionProvider } from '@/components/providers/session-provider'
import { SyncStateProvider } from '@/components/providers/sync-state-provider'
import { ProgressBar } from '@/components/ui/progress-bar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Route } from '@/lib/navigation'
import { getCookie } from '@/lib/server'

export default async ({ children }: React.PropsWithChildren) => {
  const api = await getApi()
  const user = api.users.current()

  if (!user) redirect(Route.Login)

  const courses = await api.courses.list()

  const organizationCookie = await getCookie('active-org')
  const organization = organizationCookie
    ? user.organizations.find(({ id }) => id === organizationCookie)
    : user.organizations?.[0]

  const sidebarOpen = await getCookie('sidebar-open')

  return (
    <SessionProvider courses={courses} organization={organization} user={user}>
      <SyncStateProvider>
        <SidebarProvider defaultOpen={sidebarOpen}>
          <HeaderProvider>
            <RouteListener />
            <ProgressBar />
            <AppSidebar />
            <SidebarInset>
              <AppHeader className="sticky top-0 z-5" />
              <main className="flex h-full min-h-[calc(100vh-72px)] flex-col px-8">{children}</main>
            </SidebarInset>
          </HeaderProvider>
        </SidebarProvider>
      </SyncStateProvider>
    </SessionProvider>
  )
}
