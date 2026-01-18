import { cookies } from '@/actions/cookies'
import { listCourses, listSkillGroups } from '@/actions/course'
import { getCurrentUser } from '@/actions/user'
import { AppHeader } from '@/components/layout/app-header'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { SuspenseLoader } from '@/components/layout/suspense-loader'
import { SessionProvider } from '@/components/providers/session-provider'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

const CoreLayout = async ({
  breadcrumb,
  children,
  organizationId,
}: LayoutProps<'/'> & {
  organizationId?: number
}) => {
  const user = await getCurrentUser()
  const organization = organizationId
    ? user.organizations.find(({ id }) => id === organizationId)
    : user.organizations[0]
  const courses = await listCourses()
  const skillGroups = await listSkillGroups()

  return (
    <SessionProvider courses={courses} organization={organization} skillGroups={skillGroups} user={user}>
      <AppSidebar />
      <SidebarInset>
        <AppHeader breadcrumb={breadcrumb} />
        <main className="mx-auto flex size-full min-h-[calc(100vh-72px)] max-w-350 flex-col px-8">
          <SuspenseLoader size="full">{children}</SuspenseLoader>
        </main>
      </SidebarInset>
    </SessionProvider>
  )
}

export default async (props: LayoutProps<'/'>) => {
  const { get } = await cookies()
  const organizationId = get('org')
  const sidebarOpen = get('sidebarOpen')
  const sidebarWidth = get('sidebarWidth')

  return (
    <SidebarProvider defaultOpen={sidebarOpen} defaultWidth={sidebarWidth}>
      <CoreLayout organizationId={organizationId} {...props} />
    </SidebarProvider>
  )
}
