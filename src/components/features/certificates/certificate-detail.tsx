'use client'

import { useState } from 'react'

import {
  CalendarIcon,
  ClipboardCheckIcon,
  DownloadIcon,
  MapPinIcon,
  MessageSquareIcon,
  TimerIcon,
  UserIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'

import { CertificateStatusBadge } from '@/components/features/certificates/certificate-status-badge'
import { ReviewForm } from '@/components/features/certificates/review/review-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type Certificate } from '@/db/queries/certificate'
import { useI18n } from '@/hooks/use-i18n'
import { useSession } from '@/hooks/use-session'

interface CertificateDetailProps {
  certificate: Certificate
}

export const CertificateDetail = ({ certificate }: CertificateDetailProps) => {
  const t = useTranslations('Certificates')
  const { locale, localize } = useI18n()
  const { user } = useSession()
  const [reviewOpen, setReviewOpen] = useState(false)

  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: 'long' })
  const start = dateFormatter.format(new Date(certificate.activityStartDate))
  const end = dateFormatter.format(new Date(certificate.activityEndDate))

  const isTutorReviewer = user.isTutor && certificate.reviewerId === user.id
  const canReview = isTutorReviewer && (certificate.isSubmitted || certificate.isInReview)

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
            {canReview && (
              <Button icon={ClipboardCheckIcon} onClick={() => setReviewOpen(true)} size="sm" variant="brand">
                {t('openReview')}
              </Button>
            )}
          </div>
        </div>

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
    </>
  )
}
