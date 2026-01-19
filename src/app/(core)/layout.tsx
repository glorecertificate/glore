import type React from 'react'

import { cookies } from '@/actions/cookies'
import { listCourses, listSkillGroups } from '@/actions/course'
import { getCurrentUser } from '@/actions/user'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { SessionProvider } from '@/components/providers/session-provider'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

const CoreLayout = async ({
  children,
  organizationId,
}: React.PropsWithChildren<{
  organizationId?: number
}>) => {
  const user = await getCurrentUser()
  const organization = organizationId
    ? user.organizations.find(({ id }) => id === organizationId)
    : user.organizations[0]
  const courses = await listCourses()
  const skillGroups = await listSkillGroups()

  return (
    <SessionProvider value={{ courses, organization, skillGroups, user }}>
      <AppSidebar />
      <SidebarInset>{children}</SidebarInset>
    </SessionProvider>
  )
}

export default async ({ children }: LayoutProps<'/'>) => {
  const { get } = await cookies()
  const organizationId = get('org')
  const sidebarOpen = get('sidebarOpen')
  const sidebarWidth = get('sidebarWidth')

  return (
    <SidebarProvider defaultOpen={sidebarOpen} defaultWidth={sidebarWidth}>
      <CoreLayout organizationId={organizationId}>{children}</CoreLayout>
    </SidebarProvider>
  )
}
