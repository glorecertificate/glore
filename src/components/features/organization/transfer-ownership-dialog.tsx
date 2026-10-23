'use client'

import { useState } from 'react'

import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { transferOrganizationOwnership } from '@/actions/organizations/members'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { type User } from '@/db/queries/user'

import { useMemberError } from './use-member-error'
import { getDisplayName } from './utils'

type Member = OrganizationPanelData['members'][number]

export const TransferOwnershipDialog = ({
  candidates,
  onOpenChange,
  onTransferred,
  open,
  organizationName,
}: {
  candidates: Member[]
  onOpenChange: (open: boolean) => void
  onTransferred: (user: User) => void
  open: boolean
  organizationName: string
}) => {
  const t = useTranslations('Organization')
  const memberError = useMemberError()
  const [target, setTarget] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [saving, setSaving] = useState(false)

  const confirmed = confirmation.trim().toLowerCase() === organizationName.trim().toLowerCase()

  const reset = () => {
    setTarget('')
    setConfirmation('')
  }

  const handleTransfer = async () => {
    setSaving(true)
    const { data, error } = await transferOrganizationOwnership({
      confirmation,
      newOwnerMembershipId: Number(target),
    })
    setSaving(false)

    if (error || !data) {
      toast.error(memberError(error?.code))
      return
    }

    toast.success(t('ownershipTransferred'))
    reset()
    onOpenChange(false)
    onTransferred(data.user)
  }

  return (
    <Dialog
      onOpenChange={next => {
        if (!next) reset()
        onOpenChange(next)
      }}
      open={open}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('transferTitle')}</DialogTitle>
          <DialogDescription>{t('transferDescription')}</DialogDescription>
        </DialogHeader>
        {candidates.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('transferNoCandidates')}</p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="transfer-target">{t('transferTarget')}</Label>
              <Select onValueChange={setTarget} value={target}>
                <SelectTrigger className="w-full" id="transfer-target">
                  <SelectValue placeholder={t('transferTargetPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {candidates.map(member => (
                    <SelectItem key={member.id} value={String(member.id)}>
                      {getDisplayName(member.user)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="transfer-confirmation">{t('confirmNameLabel', { name: organizationName })}</Label>
              <Input
                autoComplete="off"
                id="transfer-confirmation"
                onChange={event => setConfirmation(event.target.value)}
                value={confirmation}
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button disabled={saving} onClick={() => onOpenChange(false)} type="button" variant="outline">
            {t('cancel')}
          </Button>
          <Button
            disabled={!(target && confirmed)}
            loading={saving}
            loadingText={t('transferring')}
            onClick={handleTransfer}
            type="button"
            variant="destructive"
          >
            {t('transferOwnership')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
