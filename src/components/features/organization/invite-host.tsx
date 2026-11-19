'use client'

import { useRouter } from 'next/navigation'
import { createContext, startTransition, use, useState } from 'react'

import { useTranslations } from 'next-intl'

import { inviteOrganizationMembers } from '@/actions/organizations/invitations'
import { LucideIcon } from '@/components/icons/lucide'
import { useI18n } from '@/components/providers/i18n'
import { Button } from '@/components/ui/button'
import { useReturnFocus } from '@/hooks/use-return-focus'

import { InviteMemberDialog } from './invite-dialog'
import { MANAGEABLE_MEMBER_ROLES, REPRESENTATIVE_INVITE_ROLES } from './utils'

const OrganizationInviteContext = createContext<(() => void) | null>(null)

export const OrganizationInviteHost = ({
  children,
  isOrgAdmin,
  organizationId,
}: {
  children: React.ReactNode
  isOrgAdmin: boolean
  organizationId?: number
}) => {
  const { refresh } = useRouter()
  const { locale } = useI18n()
  const { remember, restore } = useReturnFocus()
  const [open, setOpen] = useState(false)
  const allowedRoles = isOrgAdmin ? [...MANAGEABLE_MEMBER_ROLES] : [...REPRESENTATIVE_INVITE_ROLES]

  const openDialog = () => {
    remember()
    setOpen(true)
  }

  return (
    <OrganizationInviteContext value={openDialog}>
      {children}
      <InviteMemberDialog
        allowedRoles={allowedRoles}
        defaultLocale={locale}
        onCloseAutoFocus={event => restore(event)}
        onInvite={input => inviteOrganizationMembers(input, organizationId)}
        onOpenChange={setOpen}
        onSent={() => startTransition(() => refresh())}
        open={open}
      />
    </OrganizationInviteContext>
  )
}

export const OrganizationInviteButton = () => {
  const t = useTranslations('Organization')
  const open = use(OrganizationInviteContext)

  return (
    <Button onClick={() => open?.()} variant="band">
      <LucideIcon name="user-plus" />
      {t('inviteMember')}
    </Button>
  )
}
