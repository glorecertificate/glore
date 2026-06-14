import { notFound } from 'next/navigation'

import { getTranslations } from 'next-intl/server'

import { getAdminUsers } from '@/actions/admin/users'
import { getCurrentUser } from '@/actions/user'
import { AdminUsers } from '@/components/features/admin/users'
import { DashboardPage } from '@/components/layout/dashboard-page'
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

const AdminUsersPage = async () => {
  const t = await getTranslations('Admin.users')

  return (
    <DashboardPage title={t('title')}>
      <AdminUsersContent />
    </DashboardPage>
  )
}

export default AdminUsersPage
