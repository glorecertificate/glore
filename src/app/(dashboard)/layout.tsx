import { Suspense } from 'react'

import { cookies } from '@/actions/cookies'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { CoursesProvider } from '@/components/providers/courses-provider'
import { NotificationsProvider } from '@/components/providers/notifications-provider'
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
          <NotificationsProvider>
            <CoursesProvider>
              <AppSidebar />
              <SidebarInset>{children}</SidebarInset>
            </CoursesProvider>
          </NotificationsProvider>
        </SessionProvider>
      </SidebarProvider>
    </Suspense>
  )
}

export default DashboardLayout
