import { notFound } from 'next/navigation'

import { getTranslations } from 'next-intl/server'

import { getOrganizations } from '@/actions/admin/organizations'
import { getCurrentUser } from '@/actions/user'
import { AdminOrganizations } from '@/components/features/admin/organizations'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { intlMetadata } from '@/lib/metadata'

export const generateMetadata = () =>
  intlMetadata({
    namespace: 'Admin.organizations',
    title: 'title',
  })

const AdminOrganizationsContent = async () => {
  const user = await getCurrentUser()
  if (!user.isAdmin) return notFound()
  const { data, error } = await getOrganizations()
  if (error || !data) throw error
  return <AdminOrganizations orgs={data} />
}

const AdminOrganizationsPage = async () => {
  const t = await getTranslations('Admin.organizations')

  return (
    <DashboardPage title={t('title')}>
      <AdminOrganizationsContent />
    </DashboardPage>
  )
}

export default AdminOrganizationsPage
