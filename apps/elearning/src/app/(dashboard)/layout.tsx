import { cookies } from 'next/headers'

import { DashboardHeader } from '@/components/layout/dashboard-header'
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar'
import ProgressBar, { ProgressBarProvider } from '@/components/ui/progress-bar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Cookie } from '@/lib/storage'
import { getUser } from '@/services/db'

export default async ({ children }: React.PropsWithChildren) => {
  const user = await getUser()

  const { get } = await cookies()
  const sidebarOpen = get(Cookie.SidebarOpen)?.value === 'true'

  return (
    <ProgressBarProvider>
      <ProgressBar />
      <SidebarProvider defaultOpen={sidebarOpen}>
        <DashboardSidebar user={user} />
        <SidebarInset>
          <DashboardHeader className="sticky top-0 z-5" />
          <main className="min-h-[calc(100vh-4rem)] px-8">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </ProgressBarProvider>
  )
}
