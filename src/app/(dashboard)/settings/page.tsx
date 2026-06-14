import { UserSettings } from '@/components/features/users/user-settings'
import { UserSettingsTabs, UserSettingsTabsList } from '@/components/features/users/user-settings-tabs'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Layout',
  title: 'settings',
})

const SettingsPage = () => (
  <UserSettingsTabs>
    <DashboardPage breadcrumb={<UserSettingsTabsList />} className="py-8">
      <UserSettings />
    </DashboardPage>
  </UserSettingsTabs>
)

export default SettingsPage
