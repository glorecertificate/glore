import { useTranslations } from 'next-intl'

import { UserSettings } from '@/components/features/users/user-settings'
import { UserSettingsTabs, UserSettingsTabsList } from '@/components/features/users/user-settings-tabs'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageHeader, PageHeaderDescription, PageHeaderHeading, PageHeaderTitle } from '@/components/ui/page-header'
import { generateIntlMetadata } from '@/lib/metadata'

export const generateMetadata = generateIntlMetadata({
  namespace: 'Layout',
  title: 'settings',
})

const SettingsHeader = () => {
  const layout = useTranslations('Layout')
  const users = useTranslations('Users')

  return (
    <PageHeader className="mb-8">
      <PageHeaderHeading>
        <PageHeaderTitle>{layout('settings')}</PageHeaderTitle>
        <PageHeaderDescription>{users('settingsDescription')}</PageHeaderDescription>
      </PageHeaderHeading>
    </PageHeader>
  )
}

const SettingsPage = () => (
  <UserSettingsTabs>
    <DashboardPage breadcrumb={<UserSettingsTabsList />} width="content">
      <SettingsHeader />
      <UserSettings />
    </DashboardPage>
  </UserSettingsTabs>
)

export default SettingsPage
