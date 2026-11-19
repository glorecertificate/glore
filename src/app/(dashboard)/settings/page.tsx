import { UserSettings } from '@/components/features/users/user-settings'
import { UserSettingsTabs, UserSettingsTabsList } from '@/components/features/users/user-settings-tabs'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageTitle } from '@/components/layout/page-title'
import { MessagesScope } from '@/components/providers/messages-scope'
import { Card } from '@/components/ui/card'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Layout',
  title: 'settings',
})

const SettingsPage = () => (
  <MessagesScope scope="settings">
    <UserSettingsTabs>
      <DashboardPage
        overlap
        breadcrumb={<UserSettingsTabsList />}
        description={<PageTitle name="settingsDescription" namespace="Users" />}
        title={<PageTitle name="settings" namespace="Layout" />}
        width="content"
      >
        <Card className="p-6 sm:p-8">
          <UserSettings />
        </Card>
      </DashboardPage>
    </UserSettingsTabs>
  </MessagesScope>
)

export default SettingsPage
