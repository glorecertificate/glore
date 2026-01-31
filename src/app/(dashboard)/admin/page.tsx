import { Suspense } from 'react'

import { getTeamMembers } from '@/actions/admin'
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
  const { data, error } = await getTeamMembers()
  if (error) throw error
  return <AdminTeam users={data} />
}

export default async () => (
  <>
    <PageHeader namespace="Admin.team" titleKey="title" />
    <PageMain>
      <Suspense fallback={<LoadingFallback />}>
        <AdminTeamPage />
      </Suspense>
    </PageMain>
  </>
)
