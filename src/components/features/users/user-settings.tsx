'use client'

import dynamic from 'next/dynamic'

import { ProfileForm } from '@/components/features/users/profile-form'
import { useUserSettingsTab } from '@/components/features/users/user-settings-tabs'
import { Separator } from '@/components/ui/separator'

const AccountForm = dynamic(async () => (await import('@/components/features/users/account-form')).AccountForm)
const PrivacyForm = dynamic(async () => (await import('@/components/features/users/privacy-form')).PrivacyForm)
const NotificationsForm = dynamic(
  async () => (await import('@/components/features/users/notifications-form')).NotificationsForm
)
const PasswordForm = dynamic(async () => (await import('@/components/features/users/password-form')).PasswordForm)
const SessionsList = dynamic(async () => (await import('@/components/features/users/sessions-list')).SessionsList)
const DataExport = dynamic(async () => (await import('@/components/features/users/data-export')).DataExport)
const DeleteAccount = dynamic(async () => (await import('@/components/features/users/delete-account')).DeleteAccount)

export const UserSettings = () => {
  const { tab } = useUserSettingsTab()
  if (tab === 'profile') return <ProfileForm />
  if (tab === 'account') return <AccountForm />
  if (tab === 'privacy') return <PrivacyForm />
  if (tab === 'notifications') return <NotificationsForm />
  if (tab === 'security') {
    return (
      <div className="space-y-0">
        <PasswordForm />
        <Separator className="my-10" />
        <SessionsList />
      </div>
    )
  }
  return (
    <div className="space-y-0">
      <DataExport />
      <Separator className="my-10" />
      <DeleteAccount />
    </div>
  )
}
