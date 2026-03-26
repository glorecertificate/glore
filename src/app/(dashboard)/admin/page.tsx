import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { getTeamMembers } from '@/actions/admin/team'
import { getCurrentUser } from '@/actions/user'
import { AdminTeam } from '@/components/features/admin/team'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { PageHeader } from '@/components/layout/page-header'
import { PageMain } from '@/components/layout/page-main'
import { intlMetadata } from '@/lib/metadata'

export const generateMetadata = () =>
  intlMetadata({
    namespace: 'Admin.team',
    title: 'title',
  })

const AdminTeamPage = async () => {
  const user = await getCurrentUser()
  if (!user.isAdmin) return notFound()

  const { data, error } = await getTeamMembers()
  if (error || !data) throw error ?? new Error('Failed to load team members')
  return <AdminTeam users={data} />
}

export default () => (
  <>
    <PageHeader namespace="Admin.team" titleKey="title" />
    <PageMain>
      <Suspense fallback={<LoadingFallback />}>
        <AdminTeamPage />
      </Suspense>
    </PageMain>
  </>
)
