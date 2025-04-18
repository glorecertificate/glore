import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'

import { api } from '@/api/client'
import { AppHeader } from '@/components/layout/app-header'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { RouteListener } from '@/components/layout/route-listener'
import { HeaderProvider } from '@/components/providers/header-provider'
import { SessionProvider } from '@/components/providers/session-provider'
import { SyncStateProvider } from '@/components/providers/sync-state-provider'
import { ProgressBar } from '@/components/ui/progress-bar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Cookie } from '@/lib/storage'

export default async ({ children }: React.PropsWithChildren) => {
  const { get } = await cookies()
  const organizationCookie = get(Cookie.Org)?.value
  const sidebarOpenCookie = get(Cookie.SidebarOpen)?.value

  const user = await api.users.getCurrent()
  const courses = await api.courses.list()
  if (!user) notFound()

  const sidebarOpen = sidebarOpenCookie === 'true'
  const organization = organizationCookie
    ? user.organizations.find(({ handle }) => handle === organizationCookie)
    : user.organizations[0]

  return (
    <SyncStateProvider>
      <SessionProvider courses={courses} organization={organization} user={user}>
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
      </SessionProvider>
    </SyncStateProvider>
  )
}
