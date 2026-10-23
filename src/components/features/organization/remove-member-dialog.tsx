'use client'

import { useState } from 'react'

import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { removeOrganizationMember } from '@/actions/organizations/members'
import { type OrganizationPanelData } from '@/actions/organizations/queries'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

import { useMemberError } from './use-member-error'
import { getDisplayName } from './utils'

type Member = OrganizationPanelData['members'][number]

export const RemoveMemberDialog = ({
  member,
  onDone,
  onOpenChange,
  organizationId,
}: {
  member: Member | null
  onDone: () => void
  onOpenChange: (open: boolean) => void
  organizationId?: number
}) => {
  const t = useTranslations('Organization')
  const memberError = useMemberError()
  const [removing, setRemoving] = useState(false)

  const handleRemove = async () => {
    if (!member) return
    setRemoving(true)
    try {
      const { error } = await removeOrganizationMember(member.id, organizationId)

      if (error) {
        toast.error(memberError(error.code))
        return
      }

      toast.success(t('memberRemoved'))
      onOpenChange(false)
      onDone()
    } finally {
      setRemoving(false)
    }
  }

  return (
    <AlertDialog onOpenChange={onOpenChange} open={Boolean(member)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('removeMemberTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('removeMemberNamed', { name: member ? getDisplayName(member.user) : '' })}{' '}
            {member?.role === 'tutor' && t('tutorReleaseNote')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={removing}>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction
            loading={removing}
            loadingText={t('removing')}
            onClick={event => {
              event.preventDefault()
              void handleRemove()
            }}
            variant="destructive"
          >
            {t('removeMember')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
