import { notFound } from 'next/navigation'

import { getAdminUsers } from '@/actions/admin/users'
import { getCurrentUser } from '@/actions/user'
import { AdminUsers } from '@/components/features/admin/users'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageTitle } from '@/components/layout/page-title'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Admin.users',
  title: 'title',
})

const AdminUsersContent = async () => {
  const user = await getCurrentUser()
  if (!user.isAdmin) return notFound()
  const { data, error } = await getAdminUsers()
  if (error || !data) throw error
  return <AdminUsers users={data} />
}

const AdminUsersPage = () => (
  <DashboardPage title={<PageTitle namespace="Admin.users" name="title" />}>
    <AdminUsersContent />
  </DashboardPage>
)

export default AdminUsersPage
