import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { getImpersonation } from '@/actions/admin/impersonation-state'
import { getPendingCounts } from '@/actions/admin/pending'
import { cookies } from '@/actions/cookies'
import { getCurrentUser } from '@/actions/user'
import { ImpersonationBanner } from '@/components/features/admin/impersonation-banner'
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { SessionProvider } from '@/components/providers/session'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { LEGAL_ACCEPT_ROOT } from '@/lib/constants'
import { getPendingLegal } from '@/lib/legal'
import { cn } from '@/lib/utils'

const DashboardLayoutContent = async ({ children }: React.PropsWithChildren) => {
  const [user, { get }, pending, impersonation] = await Promise.all([
    getCurrentUser(),
    cookies(),
    getPendingCounts(),
    getImpersonation(),
  ])
  if (!impersonation && (await getPendingLegal(user.id))) redirect(LEGAL_ACCEPT_ROOT)

  const org = get('org')
  const organizationId = user.organizations.find(({ id }) => id === org)?.id ?? user.organizations[0]?.id
  const sidebarOpen = get('sidebarOpen')
  const sidebarWidth = get('sidebarWidth')

  return (
    <SidebarProvider defaultOpen={sidebarOpen} defaultWidth={sidebarWidth}>
      <SessionProvider impersonating={impersonation !== null} organizationId={organizationId} user={user}>
        <DashboardSidebar pending={pending} />
        <SidebarInset className={cn(impersonation && 'pb-32 sm:pb-24')}>{children}</SidebarInset>
        <ImpersonationBanner />
      </SessionProvider>
    </SidebarProvider>
  )
}

const DashboardLayout = ({ children }: LayoutProps<'/'>) => (
  <Suspense fallback={<LoadingFallback size="full" />}>
    <DashboardLayoutContent>{children}</DashboardLayoutContent>
  </Suspense>
)

export default DashboardLayout
