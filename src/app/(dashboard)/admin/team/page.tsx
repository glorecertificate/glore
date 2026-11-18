import { notFound } from 'next/navigation'

import { loadAdminTeam } from '@/actions/admin/views'
import { getViewer } from '@/actions/viewer'
import { AdminDialogProvider } from '@/components/features/admin/dialog-provider'
import { AdminTeam } from '@/components/features/admin/team'
import { AdminTeamActions } from '@/components/features/admin/team-actions'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageTitle } from '@/components/layout/page-title'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Admin.team',
  title: 'title',
})

const AdminContent = async () => {
  const user = await getViewer()
  if (!user.isAdmin) return notFound()
  const { data, error } = await loadAdminTeam()
  if (error || !data) throw error
  return <AdminTeam users={data} />
}

const AdminPage = () => (
  <DashboardPage
    overlap
    actions={<AdminTeamActions />}
    description={<PageTitle namespace="Admin.team" name="description" />}
    provider={AdminDialogProvider}
    title={<PageTitle namespace="Admin.team" name="title" />}
  >
    <AdminContent />
  </DashboardPage>
)

export default AdminPage
