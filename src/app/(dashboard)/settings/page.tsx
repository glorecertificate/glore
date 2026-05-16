import { Suspense } from 'react'

import { listUserSessions } from '@/actions/auth'
import { AccountSessions } from '@/components/features/users/account-sessions'
import { UserSettings } from '@/components/features/users/user-settings'
import { UserSettingsTabs, UserSettingsTabsList } from '@/components/features/users/user-settings-tabs'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { intlMetadata } from '@/lib/metadata'

export const generateMetadata = () =>
  intlMetadata({
    namespace: 'Layout',
    title: 'settings',
  })

const SessionsContent = async () => {
  const { currentToken, sessions } = await listUserSessions()
  return <AccountSessions currentToken={currentToken} sessions={sessions} />
}

const SettingsPage = () => (
  <UserSettingsTabs>
    <DashboardPage breadcrumb={<UserSettingsTabsList />} title="Settings" className="py-8">
      <UserSettings
        sessionsContent={
          <Suspense fallback={<LoadingFallback />}>
            <SessionsContent />
          </Suspense>
        }
      />
    </DashboardPage>
  </UserSettingsTabs>
)

export default SettingsPage
