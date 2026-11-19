import { UserSettings } from '@/components/features/users/user-settings'
import { UserSettingsNav } from '@/components/features/users/user-settings-tabs'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageTitle } from '@/components/layout/page-title'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Layout',
  title: 'settings',
})

const SettingsPage = () => (
  <DashboardPage
    description={<PageTitle name="settingsDescription" namespace="Users" />}
    title={<PageTitle name="settings" namespace="Layout" />}
    overlap
    width="full"
  >
    <div className="grid gap-4 lg:grid-cols-[13rem_minmax(0,42.5rem)] lg:gap-12">
      <UserSettingsNav />
      <div className="min-w-0 rounded-xl border border-border-subtle bg-card p-5 shadow-card sm:p-8">
        <UserSettings />
      </div>
    </div>
  </DashboardPage>
)

export default SettingsPage
