'use client'

import { useTranslations } from 'next-intl'

import { LucideIcon } from '@/components/icons/lucide'
import { Button } from '@/components/ui/button'

import { useAdminDialog } from './dialog-provider'

export const AdminTeamActions = () => {
  const t = useTranslations('Admin.team')
  const { open } = useAdminDialog()

  return (
    <Button onClick={() => open('invite')} variant="band">
      <LucideIcon name="user-plus" />
      {t('inviteMember')}
    </Button>
  )
}
