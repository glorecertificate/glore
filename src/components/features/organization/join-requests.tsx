'use client'

import { useCallback, useMemo, useState } from 'react'

import { MailIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { approveOrganizationJoinRequest, rejectOrganizationJoinRequest } from '@/actions/organization-management'
import { type OrganizationPanelData } from '@/actions/organization-queries'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useI18n } from '@/hooks/use-i18n'

import { formatRoleLabel } from './utils'

const RejectRequestDialog = ({
  onConfirm,
  onOpenChange,
  open,
}: {
  onConfirm: (comment: string) => Promise<void>
  onOpenChange: (open: boolean) => void
  open: boolean
}) => {
  const t = useTranslations('Organization')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleConfirm = useCallback(async () => {
    try {
      setSubmitting(true)
      await onConfirm(comment)
      setComment('')
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }, [comment, onConfirm, onOpenChange])

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

  const [activeRequestId, setActiveRequestId] = useState<number | null>(null)
  const [rejectRequestId, setRejectRequestId] = useState<number | null>(null)

  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }), [locale])

  const handleApproveRequest = useCallback(
    async (requestId: number) => {
      setActiveRequestId(requestId)

      const { error } = await approveOrganizationJoinRequest(requestId)

      setActiveRequestId(null)

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success(t('joinRequestApproved'))
      onRefresh()
    },
    [onRefresh, t]
  )

  const handleRejectRequest = useCallback(
    async (comment: string) => {
      if (!rejectRequestId) {
        return
      }

      setActiveRequestId(rejectRequestId)

      const { error } = await rejectOrganizationJoinRequest(rejectRequestId, comment)

      setActiveRequestId(null)

      if (error) {
        toast.error(error.message)
        return
      }

      setRejectRequestId(null)
      toast.success(t('joinRequestRejected'))
      onRefresh()
    },
    [onRefresh, rejectRequestId, t]
  )

  return (
    <>
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">{t('joinRequestsTitle')}</h2>
          <p className="text-sm text-muted-foreground">{t('joinRequestsDescription')}</p>
        </div>

        {joinRequests.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <MailIcon className="size-8 text-muted-foreground/50" />
              <div className="space-y-1">
                <p className="text-sm font-medium">{t('noJoinRequests')}</p>
                <p className="text-xs text-muted-foreground">{t('noJoinRequestsDescription')}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {joinRequests.map(request => (
              <Card key={request.id}>
                <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{request.fullName}</p>
                      <Badge variant="outline">{formatRoleLabel(request.role, t)}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{request.email}</p>
                    {request.message && <p className="text-sm whitespace-pre-wrap">{request.message}</p>}
                    <p className="text-xs text-muted-foreground">
                      {t('requestedOn', { date: dateFormatter.format(new Date(request.createdAt)) })}
                    </p>
                  </div>

                  <div className="flex gap-2">
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
                </CardContent>
              </Card>
            ))}
          </div>
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
