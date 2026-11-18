'use client'

import { ImpersonationLockNote } from '@/components/features/admin/impersonation-lock-note'
import { AccountForm } from '@/components/features/users/account-form'
import { DataExport } from '@/components/features/users/data-export'
import { DeleteAccount } from '@/components/features/users/delete-account'
import { NotificationsForm } from '@/components/features/users/notifications-form'
import { PasswordForm } from '@/components/features/users/password-form'
import { PrivacyForm } from '@/components/features/users/privacy-form'
import { ProfileForm } from '@/components/features/users/profile-form'
import { SessionsList } from '@/components/features/users/sessions-list'
import { useUserSettingsTab } from '@/components/features/users/user-settings-tabs'
import { Separator } from '@/components/ui/separator'

export const UserSettings = () => {
  const { tab } = useUserSettingsTab()
  if (tab === 'profile') return <ProfileForm />
  if (tab === 'account') return <AccountForm />
  if (tab === 'privacy') return <PrivacyForm />
  if (tab === 'notifications') return <NotificationsForm />
  if (tab === 'security') {
    return (
      <div className="space-y-0">
        <ImpersonationLockNote className="mb-6" />
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
