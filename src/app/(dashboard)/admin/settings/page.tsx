import { getSettings } from '@/actions/admin/settings'
import { AdminSettingsForm } from '@/components/features/admin/settings-form'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageTitle } from '@/components/layout/page-title'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Admin.settings',
  title: 'title',
})

const AdminSettingsContent = async () => {
  const { data, error } = await getSettings()
  if (error || !data) throw new Error(error?.message ?? 'Settings unavailable')

  return <AdminSettingsForm settings={data} />
}

const AdminSettingsPage = () => (
  <DashboardPage
    overlap
    description={<PageTitle namespace="Admin.settings" name="description" />}
    title={<PageTitle namespace="Admin.settings" name="title" />}
    width="content"
  >
    <AdminSettingsContent />
  </DashboardPage>
)

export default AdminSettingsPage
