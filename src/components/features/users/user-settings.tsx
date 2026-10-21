'use client'

import dynamic from 'next/dynamic'

import { ProfileForm } from '@/components/features/users/profile-form'
import { useUserSettingsTab } from '@/components/features/users/user-settings-tabs'

const AccountForm = dynamic(async () => (await import('@/components/features/users/account-form')).AccountForm)

export const UserSettings = () => {
  const { tab } = useUserSettingsTab()
  if (tab === 'profile') return <ProfileForm />
  if (tab === 'account') return <AccountForm />
  return null
}
