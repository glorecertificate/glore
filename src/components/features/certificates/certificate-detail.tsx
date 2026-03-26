'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import {
  CalendarIcon,
  ClipboardCheckIcon,
  DownloadIcon,
  MapPinIcon,
  MessageSquareIcon,
  PartyPopperIcon,
  PencilIcon,
  TimerIcon,
  UserCheckIcon,
  UserIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { assignCertificateTutor } from '@/actions/certificate-management'
import { CertificateShare } from '@/components/features/certificates/certificate-share'
import { CertificateStatusBadge } from '@/components/features/certificates/certificate-status-badge'
import { ResubmitForm } from '@/components/features/certificates/resubmit/resubmit-form'
import { ReviewForm } from '@/components/features/certificates/review/review-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { type Certificate } from '@/db/queries/certificate'
import { useI18n } from '@/hooks/use-i18n'
import { useSession } from '@/hooks/use-session'

interface OrgTutor {
  id: string
  firstName: string | null
  lastName: string | null
}

interface CertificateDetailProps {
  certificate: Certificate
  tutors?: OrgTutor[]
}

export const CertificateDetail = ({ certificate, tutors }: CertificateDetailProps) => {
  const t = useTranslations('Certificates')
  const router = useRouter()
  const { locale, localize } = useI18n()
  const { user } = useSession()
  const [reviewOpen, setReviewOpen] = useState(false)
  const [resubmitOpen, setResubmitOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: 'long' })
  const start = dateFormatter.format(new Date(certificate.activityStartDate))
  const end = dateFormatter.format(new Date(certificate.activityEndDate))

  const isTutorReviewer = user.isTutor && certificate.reviewerId === user.id
  const canReview = isTutorReviewer && (certificate.isSubmitted || certificate.isInReview)
  const isOwner = certificate.userId === user.id
  const canResubmit = isOwner && certificate.isChangesRequested
  const canAssignTutor = Array.isArray(tutors) && !certificate.isApproved
  const canReleaseSelf = isTutorReviewer && !certificate.isApproved && !canAssignTutor

  const handleAssignTutor = (value: string) => {
    startTransition(async () => {
      const { error } = await assignCertificateTutor(certificate.id, value || null)
      if (error) {
        toast.error(t('assignTutorError'))
        return
      }
      toast.success(t('assignTutorSuccess'))
      router.refresh()
    })
  }

  const handleReleaseSelf = () => {
    startTransition(async () => {
      const { error } = await assignCertificateTutor(certificate.id, null)
      if (error) {
        toast.error(t('assignTutorError'))
        return
      }
      toast.success(t('selfReleaseSuccess'))
      router.refresh()
    })
  }

  return (
    <>
      <div className="flex flex-col gap-6 py-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">{certificate.organization.name}</h2>
            {certificate.user && (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <UserIcon className="size-3.5 shrink-0" />
                {certificate.user.firstName} {certificate.user.lastName}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <CertificateStatusBadge status={certificate.status} />
            {certificate.isApproved && certificate.documentUrl && (
              <Button asChild icon={DownloadIcon} size="sm" variant="outline">
                <a download href={certificate.documentUrl} rel="noopener noreferrer" target="_blank">
                  {t('download')}
                </a>
              </Button>
            )}
            {canResubmit && (
              <Button icon={PencilIcon} onClick={() => setResubmitOpen(true)} size="sm" variant="outline">
                {t('resubmitButton')}
              </Button>
            )}
            {canReview && (
              <Button icon={ClipboardCheckIcon} onClick={() => setReviewOpen(true)} size="sm" variant="brand">
                {t('openReview')}
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-lg border px-4 py-2.5">
          <div className="flex items-center gap-2 text-sm">
            <UserCheckIcon className="size-4 shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">{t('reviewer')}:</span>
            <span className="font-medium">
              {certificate.reviewer
                ? `${certificate.reviewer.firstName} ${certificate.reviewer.lastName}`
                : t('reviewerUnassigned')}
            </span>
          </div>
          {canAssignTutor &&
            (tutors!.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t('noTutorsAvailable')}</p>
            ) : (
              <Select disabled={isPending} onValueChange={handleAssignTutor} value={certificate.reviewerId ?? ''}>
                <SelectTrigger className="h-8 w-48">
                  <SelectValue placeholder={t('reviewerUnassigned')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('reviewerUnassigned')}</SelectItem>
                  {tutors!.map(tutor => (
                    <SelectItem key={tutor.id} value={tutor.id}>
                      {tutor.firstName} {tutor.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
          {canReleaseSelf && (
            <Button disabled={isPending} onClick={handleReleaseSelf} size="sm" variant="ghost">
              {t('selfRelease')}
            </Button>
          )}
        </div>

        {certificate.isApproved && isOwner && (
          <div className="flex flex-col gap-3 rounded-lg border border-success/30 bg-success/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-success">
              <PartyPopperIcon className="size-4 shrink-0" />
              {t('approvedBanner')}
            </div>
            <CertificateShare certificate={certificate} />
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarIcon className="size-4" />
                {t('activityStartDate')} – {t('activityEndDate')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                {start} – {end}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPinIcon className="size-4" />
                {t('activityLocation')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{certificate.activityLocation}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                <TimerIcon className="size-4" />
                {t('activityDuration')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{certificate.activityDuration}h</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">{t('skills')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {certificate.skills.map(s => (
                  <li className="text-sm" key={s.id}>
                    {s.course.title ? localize(s.course.title) : s.course.slug}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">{t('activityDescription')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{certificate.activityDescription}</p>
          </CardContent>
        </Card>

        {certificate.isChangesRequested && certificate.reviewerComment && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm text-destructive">
                <MessageSquareIcon className="size-4" />
                {t('reviewerCommentLabel')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{certificate.reviewerComment}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {canReview && <ReviewForm certificate={certificate} onOpenChange={setReviewOpen} open={reviewOpen} />}
      {canResubmit && <ResubmitForm certificate={certificate} onOpenChange={setResubmitOpen} open={resubmitOpen} />}
    </>
  )
}
