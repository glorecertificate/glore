'use client'

import { useState } from 'react'

import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { updateOrganizationMemberRole } from '@/actions/organizations/members'
import { type OrganizationPanelData } from '@/actions/organizations/queries'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { type OrganizationMembershipRole } from '@/db/queries/organization'

import { useMemberError } from './use-member-error'
import { MANAGEABLE_MEMBER_ROLES, formatRoleLabel, getDisplayName } from './utils'

type Member = OrganizationPanelData['members'][number]

export const ChangeRoleDialog = ({
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
  const [role, setRole] = useState<OrganizationMembershipRole | null>(null)
  const [saving, setSaving] = useState(false)

  const current = role ?? member?.role
  const options = MANAGEABLE_MEMBER_ROLES.filter(item => item !== member?.role)

  const handleSave = async () => {
    if (!(member && role)) return
    setSaving(true)
    const { error } = await updateOrganizationMemberRole(member.id, role, organizationId)
    setSaving(false)

    if (error) {
      toast.error(memberError(error.code))
      return
    }

    toast.success(t('memberRoleUpdated'))
    onOpenChange(false)
    onDone()
  }

  return (
    <Dialog
      onOpenChange={open => {
        if (!open) setRole(null)
        onOpenChange(open)
      }}
      open={Boolean(member)}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('changeRoleTitle')}</DialogTitle>
          <DialogDescription>
            {t('changeRoleDescription', { name: member ? getDisplayName(member.user) : '' })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="change-role">{t('newRole')}</Label>
          <Select onValueChange={value => setRole(value as OrganizationMembershipRole)} value={role ?? undefined}>
            <SelectTrigger className="w-full" id="change-role">
              <SelectValue placeholder={current ? formatRoleLabel(current, t) : undefined} />
            </SelectTrigger>
            <SelectContent>
              {options.map(item => (
                <SelectItem key={item} value={item}>
                  {formatRoleLabel(item, t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {member?.role === 'tutor' && <p className="text-sm text-muted-foreground">{t('tutorReleaseNote')}</p>}
        </div>
        <DialogFooter>
          <Button disabled={saving} onClick={() => onOpenChange(false)} type="button" variant="outline">
            {t('cancel')}
          </Button>
          <Button disabled={!role} loading={saving} loadingText={t('saving')} onClick={handleSave} type="button">
            {t('saveRole')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
