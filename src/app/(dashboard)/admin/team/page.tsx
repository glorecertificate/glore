import { notFound } from 'next/navigation'

import { getTeamMembers } from '@/actions/admin/team'
import { getCurrentUser } from '@/actions/user'
import { AdminTeam } from '@/components/features/admin/team'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageTitle } from '@/components/layout/page-title'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Admin.team',
  title: 'title',
})

const AdminContent = async () => {
  const user = await getCurrentUser()
  if (!user.isAdmin) return notFound()
  const { data, error } = await getTeamMembers()
  if (error || !data) throw error
  return <AdminTeam users={data} />
}

const AdminPage = () => (
  <DashboardPage title={<PageTitle namespace="Admin.team" name="title" />}>
    <AdminContent />
  </DashboardPage>
)

export default AdminPage
