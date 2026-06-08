'use client'

import { useState } from 'react'

import { Trash2Icon, UserPlusIcon, UsersIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import {
  inviteOrganizationMember,
  removeOrganizationMember,
  updateOrganizationMemberRole,
} from '@/actions/organizations/members'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { type OrganizationMembershipRole } from '@/db/queries/organization'
import { useI18n } from '@/hooks/use-i18n'

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

        <div className="space-y-3">
          {members.length === 0 ? (
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <UsersIcon />
                </EmptyMedia>
                <EmptyTitle>{t('noMembers')}</EmptyTitle>
                <EmptyDescription>{t('noMembersDescription')}</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={() => setInviteOpen(true)} size="sm" variant="brand">
                  <UserPlusIcon className="size-3.5" />
                  {t('inviteMember')}
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            members.map(member => (
              <Card key={member.id}>
                <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="size-11 rounded-full">
                      {member.user.avatarUrl && (
                        <AvatarImage alt={member.fullName || member.user.email} src={member.user.avatarUrl} />
                      )}
                      <AvatarFallback className="rounded-full text-sm font-medium">
                        {member.fullName
                          .split(' ')
                          .flatMap(name => (name ? [name.charAt(0).toUpperCase()] : []))
                          .slice(0, 2)
                          .join('') || member.user.email.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">{getDisplayName(member.user)}</p>
                        {member.user.id === currentUserId && (
                          <Badge size="sm" variant="outline">
                            {t('you')}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{member.user.email}</p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Badge variant="ghost">{formatRoleLabel(member.role, t)}</Badge>
                        <Badge variant="ghost">{member.isPending ? t('statusPending') : t('statusJoined')}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:min-w-56 sm:items-end">
                    {isOrgAdmin && member.user.id !== currentUserId ? (
                      <Select
                        disabled={activeMembershipId === member.id}
                        onValueChange={value => handleRoleChange(member.id, value as OrganizationMembershipRole)}
                        value={member.role}
                      >
                        <SelectTrigger className="w-full sm:w-48">
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
                      <p className="text-xs text-muted-foreground">
                        {t('memberSince', { date: dateFormatter.format(new Date(member.createdAt)) })}
                      </p>
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
                </CardContent>
              </Card>
            ))
          )}
        </div>
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
