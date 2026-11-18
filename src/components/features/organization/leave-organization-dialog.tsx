'use client'

import { useState } from 'react'

import { useTranslations } from 'next-intl'

import { leaveOrganization } from '@/actions/organizations/members'
import { useSession } from '@/components/providers/session'
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
import { toast } from '@/components/ui/toast'
import { type User } from '@/db/queries/user'

import { useMemberError } from './use-member-error'

export const LeaveOrganizationDialog = ({
  onLeft,
  onCloseAutoFocus,
  onOpenChange,
  open,
  organizationId,
  organizationName,
}: {
  onLeft: (user: User) => void
  onCloseAutoFocus?: (event: Event) => void
  onOpenChange: (open: boolean) => void
  open: boolean
  organizationId: number
  organizationName: string
}) => {
  const t = useTranslations('Organization')
  const { user } = useSession()
  const memberError = useMemberError()
  const [leaving, setLeaving] = useState(false)
  const isTutor = user.organizations.some(({ id, role }) => id === organizationId && role === 'tutor')

  const handleLeave = async () => {
    setLeaving(true)
    try {
      const { data, error } = await leaveOrganization(organizationId)

      if (error || !data) {
        toast.error(memberError(error?.code))
        return
      }

      toast.success(t('leftOrganization'))
      onOpenChange(false)
      onLeft(data.user)
    } finally {
      setLeaving(false)
    }
  }

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent onCloseAutoFocus={onCloseAutoFocus}>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('leaveTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('leaveDescription', { name: organizationName })}</AlertDialogDescription>
          {isTutor && <p className="text-sm text-muted-foreground">{t('leaveTutorNote')}</p>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={leaving}>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction
            loading={leaving}
            loadingText={t('leaving')}
            onClick={event => {
              event.preventDefault()
              void handleLeave()
            }}
            variant="destructive"
          >
            {t('leaveOrganization')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
