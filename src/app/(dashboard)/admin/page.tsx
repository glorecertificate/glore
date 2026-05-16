import { notFound } from 'next/navigation'

import { getTranslations } from 'next-intl/server'

import { getTeamMembers } from '@/actions/admin/team'
import { getCurrentUser } from '@/actions/user'
import { AdminTeam } from '@/components/features/admin/team'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { intlMetadata } from '@/lib/metadata'

export const generateMetadata = () =>
  intlMetadata({
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

const AdminPage = async () => {
  const t = await getTranslations('Admin.team')

  return (
    <DashboardPage title={t('title')}>
      <AdminContent />
    </DashboardPage>
  )
}

export default AdminPage
