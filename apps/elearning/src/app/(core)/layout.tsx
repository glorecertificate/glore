import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { api } from '@/api/client'
import { AppHeader } from '@/components/layout/app-header'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { RouteListener } from '@/components/layout/route-listener'
import { HeaderProvider } from '@/components/providers/header-provider'
import { SessionProvider } from '@/components/providers/session-provider'
import { SyncStateProvider } from '@/components/providers/sync-state-provider'
import { ProgressBar } from '@/components/ui/progress-bar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Route } from '@/lib/navigation'
import { Cookie } from '@/lib/storage'

export default async ({ children }: React.PropsWithChildren) => {
  const { get } = await cookies()

  const user = await api.users.getCurrent()
  if (!user) redirect(Route.Login)

  const courses = await api.courses.list()

  const organizationCookie = get(Cookie.Org)?.value
  const organization = organizationCookie
    ? user.organizations.find(({ handle }) => handle === organizationCookie)
    : user.organizations[0]

  const sidebarOpen = get(Cookie.SidebarOpen)?.value === 'true'

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
              <main className="min-h-[calc(100vh-72px)]">{children}</main>
            </SidebarInset>
          </HeaderProvider>
        </SidebarProvider>
      </SyncStateProvider>
    </SessionProvider>
  )
}
