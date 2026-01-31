import { UserSettings } from '@/components/features/users/user-settings'
import { UserSettingsHeader } from '@/components/features/users/user-settings-header'
import { UserSettingsTabs } from '@/components/features/users/user-settings-tabs'
import { PageMain } from '@/components/layout/page-main'
import { intlMetadata } from '@/lib/metadata'

export const generateMetadata = () =>
  intlMetadata({
    namespace: 'Layout',
    title: 'settings',
  })

export default () => (
  <UserSettingsTabs>
    <UserSettingsHeader />
    <PageMain className="py-8">
      <UserSettings />
    </PageMain>
  </UserSettingsTabs>
)
