import { Suspense } from 'react'

import { cookies } from '@/actions/cookies'
import { listCourses, listSkillGroups } from '@/actions/course'
import { getCurrentUser } from '@/actions/user'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { SessionProvider } from '@/components/providers/session-provider'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

const CoreLayout = async ({ children }: React.PropsWithChildren) => {
  const { get } = await cookies()
  const organizationId = get('org')
  const sidebarOpen = get('sidebarOpen')
  const sidebarWidth = get('sidebarWidth')

  const user = await getCurrentUser()
  const organization = organizationId
    ? user.organizations.find(({ id }) => id === organizationId)
    : user.organizations[0]
  const courses = await listCourses()
  const skillGroups = await listSkillGroups()

  return (
    <SidebarProvider defaultOpen={sidebarOpen} defaultWidth={sidebarWidth}>
      <SessionProvider value={{ courses, organization, skillGroups, user }}>
        <AppSidebar />
        <SidebarInset>{children}</SidebarInset>
      </SessionProvider>
    </SidebarProvider>
  )
}

export default async ({ children }: LayoutProps<'/'>) => (
  <Suspense fallback={<LoadingFallback size="full" />}>
    <CoreLayout>{children}</CoreLayout>
  </Suspense>
)
