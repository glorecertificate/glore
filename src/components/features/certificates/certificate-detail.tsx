'use client'

import { useTranslations } from 'next-intl'

import { type CertificateActivityEvent, type CertificateReviewNotes } from '@/actions/certificates/queries'
import { CertificateCelebration } from '@/components/features/certificates/certificate-celebration'
import { CertificateFeedback } from '@/components/features/certificates/certificate-feedback'
import { CertificateJourney } from '@/components/features/certificates/certificate-journey'
import { CertificatePreview } from '@/components/features/certificates/certificate-preview'
import { CertificateReviewer, type OrgTutor } from '@/components/features/certificates/certificate-reviewer'
import { CertificateShare } from '@/components/features/certificates/certificate-share'
import { CertificateSummary } from '@/components/features/certificates/certificate-summary'
import { CertificateTimeline } from '@/components/features/certificates/certificate-timeline'
import { useSession } from '@/components/providers/session'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type Certificate } from '@/db/queries/certificate'
import { cn } from '@/lib/utils'

export const CertificateDetail = ({
  canManage,
  certificate,
  events,
  notes,
  tutors,
  verifyUrl,
}: {
  canManage: boolean
  certificate: Certificate
  events: CertificateActivityEvent[]
  notes: CertificateReviewNotes | null
  tutors?: OrgTutor[]
  verifyUrl: string | null
}) => {
  const tDetail = useTranslations('CertificateDetail')
  const { user } = useSession()
  const isOwner = certificate.userId === user.id
  const showShare = isOwner && Boolean(verifyUrl)
  const pdfHref = certificate.documentUrl ?? `/api/v1/certificates/${certificate.id}/pdf`

  return (
    <div className="flex flex-col gap-6">
      {isOwner && certificate.isApproved && <CertificateCelebration id={certificate.id} />}

      <Card>
        <CardContent className="py-6">
          <CertificateJourney status={certificate.status} />
        </CardContent>
      </Card>

      {showShare && (
        <div className="flex flex-col gap-3 lg:hidden">
          <CertificatePreview certificate={certificate} />
          {certificate.isApproved && (
            <Button asChild className="self-center" icon="external-link" size="sm" variant="outline">
              <a href={pdfHref} rel="noopener noreferrer" target="_blank">
                {tDetail('viewFull')}
              </a>
            </Button>
          )}
        </div>
      )}

      {isOwner && verifyUrl && <CertificateShare certificate={certificate} url={verifyUrl} />}

      <CertificateFeedback certificate={certificate} notes={notes} />

      {!certificate.isDraft && (certificate.reviewerId || (certificate.isOpen && canManage)) && (
        <CertificateReviewer certificate={certificate} tutors={tutors} />
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <CertificatePreview
          certificate={certificate}
          className={cn('lg:sticky lg:top-20', showShare && 'max-lg:hidden')}
        />
        <div className="flex flex-col gap-6">
          <CertificateSummary certificate={certificate} />
          <Card>
            <CardHeader>
              <CardTitle className="type-label text-muted-foreground">{tDetail('timeline')}</CardTitle>
            </CardHeader>
            <CardContent>
              <CertificateTimeline certificate={certificate} events={events} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
