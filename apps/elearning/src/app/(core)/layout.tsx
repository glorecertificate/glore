import { redirect } from 'next/navigation'

import { AppHeader } from '@/components/layout/app-header'
import { AppMain } from '@/components/layout/app-main'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { RouteListener } from '@/components/layout/route-listener'
import { SuspenseLoader } from '@/components/layout/suspense-loader'
import { SessionProvider } from '@/components/providers/session-provider'
import { ProgressBar, ProgressBarProvider } from '@/components/ui/progress-bar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { getCurrentUser, getSkillGroups, listCourses } from '@/lib/data/server'
import { serverCookies } from '@/lib/storage/server'

export default async ({ children }: LayoutProps<'/'>) => {
  const cookies = await serverCookies()
  const user = await getCurrentUser()

  if (!user) {
    cookies.reset()
    redirect('/login')
  }

  const org = cookies.get('org')
  const sidebarOpen = cookies.get('sidebar_open')
  const sidebarWidth = cookies.get('sidebar_width')

  const courses = await listCourses()
  const skillGroups = await getSkillGroups()

  const organization = org ? user.organizations.find(({ id }) => id === org) : user.organizations?.[0]

  return (
    <SidebarProvider defaultOpen={sidebarOpen} defaultWidth={sidebarWidth}>
      <ProgressBarProvider>
        <ProgressBar />
        <SessionProvider courses={courses} organization={organization} skillGroups={skillGroups} user={user}>
          <AppSidebar />
          <SidebarInset>
            <AppHeader />
            <SuspenseLoader size="full">
              <AppMain>{children}</AppMain>
            </SuspenseLoader>
          </SidebarInset>
        </SessionProvider>
        <RouteListener />
      </ProgressBarProvider>
    </SidebarProvider>
  )
}
