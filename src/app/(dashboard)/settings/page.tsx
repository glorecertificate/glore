import { Suspense } from 'react'

import { listUserSessions } from '@/actions/auth'
import { AccountSessions } from '@/components/features/users/account-sessions'
import { UserSettings } from '@/components/features/users/user-settings'
import { UserSettingsHeader } from '@/components/features/users/user-settings-header'
import { UserSettingsTabs } from '@/components/features/users/user-settings-tabs'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { PageMain } from '@/components/layout/page-main'
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
    <UserSettingsHeader />
    <PageMain className="py-8">
      <UserSettings
        sessionsContent={
          <Suspense fallback={<LoadingFallback />}>
            <SessionsContent />
          </Suspense>
        }
      />
    </PageMain>
  </UserSettingsTabs>
)

export default SettingsPage
