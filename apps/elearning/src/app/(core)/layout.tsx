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
import { getCurrentUser, listCourses } from '@/lib/data/server'
import { serverCookies } from '@/lib/storage/server'

const resolveCoreLayoutData = async () => {
  const { get, reset } = await serverCookies()
  const user = await getCurrentUser()

  if (!user) {
    reset()
    redirect('/login')
  }

  const org = get('org')
  const sidebarOpen = get('sidebar-open')

  const courses = await listCourses()

  return { courses, org, sidebarOpen, user }
}

const CoreLayoutContent = ({ children }: LayoutProps<'/'>) => {
  const { courses, org, sidebarOpen, user } = use(resolveCoreLayoutData())

  const organization = org ? user.organizations.find(({ id }) => id === org) : user.organizations?.[0]

  return (
    <SessionProvider courses={courses} organization={organization} user={user}>
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
