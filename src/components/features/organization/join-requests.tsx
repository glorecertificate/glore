'use client'

import { useState } from 'react'

import { useTranslations } from 'next-intl'

import { type OrganizationPanelData } from '@/actions/organizations/queries'
import { approveOrganizationJoinRequest, rejectOrganizationJoinRequest } from '@/actions/organizations/requests'
import { useInvitationError } from '@/components/features/organization/use-invitation-error'
import { LucideIcon } from '@/components/icons/lucide'
import { useI18n } from '@/components/providers/i18n'
import { AnimatedList, AnimatedListItem } from '@/components/ui/animated-list'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast'

import { TabHeader } from './tab-header'
import { formatRoleLabel } from './utils'

const RejectRequestDialog = ({
  onConfirm,
  onOpenChange,
  open,
}: {
  onConfirm: (comment: string) => Promise<boolean>
  onOpenChange: (open: boolean) => void
  open: boolean
}) => {
  const t = useTranslations('Organization')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleConfirm = async () => {
    try {
      setSubmitting(true)
      const rejected = await onConfirm(comment)
      if (!rejected) return
      setComment('')
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('rejectRequestTitle')}</DialogTitle>
          <DialogDescription>{t('rejectRequestDescription')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="organization-request-comment">{t('optionalMessage')}</Label>
          <Textarea
            id="organization-request-comment"
            onChange={e => setComment(e.target.value)}
            placeholder={t('optionalMessagePlaceholder')}
            value={comment}
          />
        </div>
        <DialogFooter>
          <Button disabled={submitting} onClick={() => onOpenChange(false)} variant="outline">
            {t('cancel')}
          </Button>
          <Button
            disabled={submitting}
            loading={submitting}
            loadingText={t('rejecting')}
            onClick={handleConfirm}
            variant="destructive"
          >
            {t('reject')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface OrganizationJoinRequestsProps {
  joinRequests: OrganizationPanelData['joinRequests']
  onRefresh: () => void
}

export const OrganizationJoinRequests = ({ joinRequests, onRefresh }: OrganizationJoinRequestsProps) => {
  const { locale } = useI18n()
  const t = useTranslations('Organization')
  const tInvitations = useTranslations('Invitations')
  const errorMessage = useInvitationError()

  const [activeRequestId, setActiveRequestId] = useState<number | null>(null)
  const [rejectRequestId, setRejectRequestId] = useState<number | null>(null)

  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' })

  const handleApproveRequest = async (requestId: number) => {
    setActiveRequestId(requestId)

    const { data, error } = await approveOrganizationJoinRequest(requestId)

    setActiveRequestId(null)

    if (error || !data) {
      toast.error(errorMessage(error?.code))
      return
    }

    toast.success(data.kind === 'member' ? t('joinRequestApproved') : tInvitations('requestApprovedInvited'))
    onRefresh()
  }

  const handleRejectRequest = async (comment: string) => {
    if (!rejectRequestId) {
      return false
    }

    setActiveRequestId(rejectRequestId)

    const { error } = await rejectOrganizationJoinRequest(rejectRequestId, comment)

    setActiveRequestId(null)

    if (error) {
      toast.error(errorMessage(error.code))
      return false
    }

    setRejectRequestId(null)
    toast.success(t('joinRequestRejected'))
    onRefresh()
    return true
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <TabHeader description={t('joinRequestsDescription')} title={t('joinRequestsTitle')} />

        {joinRequests.length === 0 && (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <LucideIcon name="inbox" />
              </EmptyMedia>
              <EmptyTitle>{t('noJoinRequests')}</EmptyTitle>
              <EmptyDescription>{t('noJoinRequestsDescription')}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
        {joinRequests.length > 0 && (
          <ul aria-label={t('joinRequestsTitle')} className="divide-y overflow-hidden rounded-xl border bg-card">
            <AnimatedList>
              {joinRequests.map(request => (
                <AnimatedListItem asChild key={request.id} variant="row">
                  <li className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 gap-3">
                      <Avatar className="size-8 rounded-full">
                        <AvatarFallback className="rounded-full">
                          {(request.fullName || request.email).slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex min-w-0 flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="font-medium wrap-anywhere">{request.fullName}</span>
                          <Badge variant="outline">{formatRoleLabel(request.role, t)}</Badge>
                        </div>
                        <span className="text-sm wrap-anywhere text-muted-foreground">{request.email}</span>
                        {request.message && (
                          <p className="mt-1 text-sm wrap-anywhere whitespace-pre-wrap">{request.message}</p>
                        )}
                        {!request.userId && (
                          <p className="type-caption text-muted-foreground">{tInvitations('requestInviteHint')}</p>
                        )}
                        <p className="type-caption text-muted-foreground">
                          {t('requestedOn', { date: dateFormatter.format(new Date(request.createdAt)) })}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <Button
                        disabled={activeRequestId === request.id}
                        loading={activeRequestId === request.id}
                        onClick={() => handleApproveRequest(request.id)}
                        size="sm"
                        variant="success"
                      >
                        {t('approve')}
                      </Button>
                      <Button
                        disabled={activeRequestId === request.id}
                        onClick={() => setRejectRequestId(request.id)}
                        size="sm"
                        variant="outline"
                      >
                        {t('reject')}
                      </Button>
                    </div>
                  </li>
                </AnimatedListItem>
              ))}
            </AnimatedList>
          </ul>
        )}
      </div>

      <RejectRequestDialog
        onConfirm={handleRejectRequest}
        onOpenChange={open => !open && setRejectRequestId(null)}
        open={!!rejectRequestId}
      />
    </>
  )
}
