'use client'

import { useTranslations } from 'next-intl'

import { LucideIcon } from '@/components/icons/lucide'
import { Button } from '@/components/ui/button'

import { useAdminDialog } from './dialog-provider'

export const AdminOrganizationsActions = () => {
  const t = useTranslations('Admin.organizations')
  const { open } = useAdminDialog()

  return (
    <>
      <Button onClick={() => open('create')} variant="band">
        <LucideIcon name="plus" />
        {t('createOrg')}
      </Button>
      <Button onClick={() => open('invite')} variant="band-secondary">
        <LucideIcon name="user-plus" />
        {t('inviteOrg')}
      </Button>
    </>
  )
}
