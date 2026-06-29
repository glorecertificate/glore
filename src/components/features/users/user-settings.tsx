'use client'

import { AccountForm } from '@/components/features/users/account-form'
import { ProfileForm } from '@/components/features/users/profile-form'
import { useUserSettingsTab } from '@/components/features/users/user-settings-tabs'

export const UserSettings = () => {
  const { tab } = useUserSettingsTab()
  if (tab === 'profile') return <ProfileForm />
  if (tab === 'account') return <AccountForm />
  return null
}
