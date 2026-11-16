import { UserSettings } from '@/components/features/users/user-settings'
import { UserSettingsTabs, UserSettingsTabsList } from '@/components/features/users/user-settings-tabs'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageTitle } from '@/components/layout/page-title'
import { MessagesScope } from '@/components/providers/messages-scope'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Layout',
  title: 'settings',
})

const SettingsPage = () => (
  <MessagesScope scope="settings">
    <UserSettingsTabs>
      <DashboardPage
        breadcrumb={<UserSettingsTabsList />}
        className="py-8"
        title={<PageTitle namespace="Layout" name="settings" />}
      >
        <UserSettings />
      </DashboardPage>
    </UserSettingsTabs>
  </MessagesScope>
)

export default SettingsPage
