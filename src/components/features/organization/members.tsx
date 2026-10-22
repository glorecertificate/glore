'use client'

import { useState } from 'react'

import { Trash2Icon, UserPlusIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import {
  inviteOrganizationMember,
  removeOrganizationMember,
  updateOrganizationMemberRole,
} from '@/actions/organizations/members'
import { type OrganizationPanelData } from '@/actions/organizations/queries'
import { useI18n } from '@/components/providers/i18n'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { type OrganizationMembershipRole } from '@/db/queries/organization'

import { InviteMemberDialog } from './invite-dialog'
import { MANAGEABLE_MEMBER_ROLES, REPRESENTATIVE_INVITE_ROLES, formatRoleLabel, getDisplayName } from './utils'

interface OrganizationMembersProps {
  currentUserId: string
  isOrgAdmin: boolean
  members: OrganizationPanelData['members']
  onRefresh: () => void
}

export const OrganizationMembers = ({ currentUserId, isOrgAdmin, members, onRefresh }: OrganizationMembersProps) => {
  const { locale } = useI18n()
  const t = useTranslations('Organization')

  const [activeMembershipId, setActiveMembershipId] = useState<number | null>(null)
  const [deleteMembershipId, setDeleteMembershipId] = useState<number | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)

  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' })
  const availableInviteRoles = isOrgAdmin ? [...MANAGEABLE_MEMBER_ROLES] : [...REPRESENTATIVE_INVITE_ROLES]

  const canDeleteMembership = (role: OrganizationMembershipRole, userId: string) => {
    if (userId === currentUserId) {
      return false
    }

    if (isOrgAdmin) {
      return true
    }

    return REPRESENTATIVE_INVITE_ROLES.some(item => item === role)
  }

  const handleInvite = async (values: {
    email: string
    firstName: string
    lastName: string
    locale: string
    role: OrganizationMembershipRole
  }) => {
    const { data, error } = await inviteOrganizationMember(values)

    if (error || !data) {
      toast.error(error?.message ?? t('inviteError'))
      return
    }

    toast.success(t('inviteSuccess', { email: data.email }))

    if (!data.emailSent) {
      toast.warning(t('inviteEmailFailed'))
    }

    onRefresh()
  }

  const handleRoleChange = async (membershipId: number, role: OrganizationMembershipRole) => {
    setActiveMembershipId(membershipId)

    const { error } = await updateOrganizationMemberRole(membershipId, role)

    setActiveMembershipId(null)

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success(t('memberRoleUpdated'))
    onRefresh()
  }

  const handleDeleteMember = async () => {
    if (!deleteMembershipId) {
      return
    }

    setActiveMembershipId(deleteMembershipId)
    const { error } = await removeOrganizationMember(deleteMembershipId)
    setActiveMembershipId(null)

    if (error) {
      toast.error(error.message)
      return
    }

    setDeleteMembershipId(null)
    toast.success(t('memberRemoved'))
    onRefresh()
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">{t('membersTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('membersDescription')}</p>
          </div>
          <Button onClick={() => setInviteOpen(true)} size="sm" variant="brand">
            <UserPlusIcon className="size-3.5" />
            {t('inviteMember')}
          </Button>
        </div>

        <DataTable
          columns={[
            {
              cell: member => (
                <div className="flex items-center gap-3">
                  <Avatar className="size-9 rounded-full">
                    {member.user.avatarUrl && <AvatarImage alt="" src={member.user.avatarUrl} />}
                    <AvatarFallback className="rounded-full">
                      {(member.fullName || member.user.email).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{getDisplayName(member.user)}</span>
                    {member.user.id === currentUserId && (
                      <Badge className="w-fit" size="sm" variant="outline">
                        {t('you')}
                      </Badge>
                    )}
                  </div>
                </div>
              ),
              header: t('members'),
              id: 'name',
              sortValue: member => getDisplayName(member.user),
            },
            {
              cell: member => member.user.email,
              header: t('email'),
              id: 'email',
              sortValue: member => member.user.email,
            },
            {
              cell: member => (
                <div className="flex flex-wrap gap-2">
                  <Badge variant="ghost">{formatRoleLabel(member.role, t)}</Badge>
                  <Badge variant="ghost">{member.isPending ? t('statusPending') : t('statusJoined')}</Badge>
                </div>
              ),
              header: t('role'),
              id: 'role',
              sortValue: member => formatRoleLabel(member.role, t),
            },
          ]}
          emptyDescription={t('noMembersDescription')}
          emptyTitle={t('noMembers')}
          getRowId={member => member.id}
          label={t('membersTitle')}
          rowActions={member => (
            <div className="flex items-center justify-end gap-2">
              {isOrgAdmin && member.user.id !== currentUserId ? (
                <Select
                  disabled={activeMembershipId === member.id}
                  onValueChange={value => handleRoleChange(member.id, value as OrganizationMembershipRole)}
                  value={member.role}
                >
                  <SelectTrigger aria-label={t('role')} className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MANAGEABLE_MEMBER_ROLES.map(role => (
                      <SelectItem key={role} value={role}>
                        {t(`role_${role}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <span className="text-xs text-muted-foreground">
                  {t('memberSince', { date: dateFormatter.format(new Date(member.createdAt)) })}
                </span>
              )}
              {canDeleteMembership(member.role, member.user.id) && (
                <Button
                  disabled={activeMembershipId === member.id}
                  onClick={() => setDeleteMembershipId(member.id)}
                  size="sm"
                  variant="outline"
                >
                  <Trash2Icon className="size-3.5" />
                  {t('removeMember')}
                </Button>
              )}
            </div>
          )}
          rows={members}
        />
      </div>

      <InviteMemberDialog
        allowedRoles={availableInviteRoles}
        defaultLocale={locale}
        onInvite={handleInvite}
        onOpenChange={setInviteOpen}
        open={inviteOpen}
      />

      <AlertDialog onOpenChange={open => !open && setDeleteMembershipId(null)} open={!!deleteMembershipId}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('removeMemberTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('removeMemberDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={activeMembershipId === deleteMembershipId}>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              loading={activeMembershipId === deleteMembershipId}
              loadingText={t('removing')}
              onClick={handleDeleteMember}
              variant="destructive"
            >
              {t('removeMember')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
