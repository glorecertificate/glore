'use client'

import { useTranslations } from 'next-intl'

import { LucideIcon } from '@/components/icons/lucide'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

import { useAdminDialog } from './dialog-provider'

export const AdminOrganizationsActions = () => {
  const t = useTranslations('Admin.organizations')
  const { open } = useAdminDialog()

  return (
    <ButtonGroup>
      <Button onClick={() => open('create')} variant="band">
        <LucideIcon name="plus" />
        {t('createOrg')}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button aria-label={t('moreOptions')} size="icon" variant="band">
            <LucideIcon name="chevron-down" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => open('invite')}>
            <LucideIcon name="user-plus" />
            {t('inviteOrg')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  )
}
