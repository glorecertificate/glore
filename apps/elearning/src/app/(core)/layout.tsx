import { redirect } from 'next/navigation'
import { use } from 'react'

import { AppHeader } from '@/components/layout/app-header'
import { AppMain } from '@/components/layout/app-main'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { RouteListener } from '@/components/layout/route-listener'
import { SuspenseLayout } from '@/components/layout/suspense-layout'
import { HeaderProvider } from '@/components/providers/header-provider'
import { SessionProvider } from '@/components/providers/session-provider'
import { ProgressBar } from '@/components/ui/progress-bar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { getCurrentUser, getSkillGroups, listCourses } from '@/lib/data/server'
import { serverCookies } from '@/lib/storage/server'

const resolveCoreLayoutData = async () => {
  const cookies = await serverCookies()
  const user = await getCurrentUser()

  if (!user) {
    cookies.reset()
    redirect('/login')
  }

  const org = cookies.get('org')
  const sidebarOpen = cookies.get('sidebar-open')

  const courses = await listCourses()
  const skillGroups = await getSkillGroups()

  return { courses, skillGroups, org, sidebarOpen, user }
}

const CoreLayoutContent = ({ children }: LayoutProps<'/'>) => {
  const { courses, org, sidebarOpen, skillGroups, user } = use(resolveCoreLayoutData())

  const organization = org ? user.organizations.find(({ id }) => id === org) : user.organizations?.[0]

  return (
    <SessionProvider courses={courses} organization={organization} skillGroups={skillGroups} user={user}>
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
    </SessionProvider>
  )
}

export default (props: LayoutProps<'/'>) => (
  <SuspenseLayout size="full">
    <CoreLayoutContent {...props} />
  </SuspenseLayout>
)
