'use client'

import { useTranslations } from 'next-intl'

import { type CertificateActivityEvent, type CertificateReviewNotes } from '@/actions/certificates/queries'
import { CertificateFeedback } from '@/components/features/certificates/certificate-feedback'
import { CertificateJourney } from '@/components/features/certificates/certificate-journey'
import { CertificatePreview } from '@/components/features/certificates/certificate-preview'
import { CertificateReviewer, type OrgTutor } from '@/components/features/certificates/certificate-reviewer'
import { CertificateShare } from '@/components/features/certificates/certificate-share'
import {
  CertificateDetails,
  CertificateSkills,
  CertificateTasks,
} from '@/components/features/certificates/certificate-summary'
import { CertificateTimeline } from '@/components/features/certificates/certificate-timeline'
import { useSession } from '@/components/providers/session'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type Certificate } from '@/db/queries/certificate'

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
  const pdfHref = certificate.documentUrl ?? `/api/v1/certificates/${certificate.id}/pdf`

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex min-w-0 flex-col gap-6 lg:col-start-1 lg:row-start-1">
        <Card>
          <CardContent className="py-6">
            <CertificateJourney certificate={certificate} />
          </CardContent>
        </Card>

        <CertificateFeedback certificate={certificate} notes={notes} />

        {!certificate.isRevoked && (
          <div className="flex flex-col items-center gap-3">
            <CertificatePreview certificate={certificate} className="w-full max-w-xl" />
            {certificate.isApproved && (
              <Button asChild icon="external-link" size="sm" variant="outline">
                <a href={pdfHref} rel="noopener noreferrer" target="_blank">
                  {tDetail('viewFull')}
                </a>
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-20 lg:col-start-2 lg:row-span-2 lg:row-start-1">
        <CertificateDetails certificate={certificate} />
        {isOwner && verifyUrl && <CertificateShare certificate={certificate} url={verifyUrl} />}
        {!certificate.isDraft && (certificate.reviewerId || (certificate.isOpen && canManage)) && (
          <CertificateReviewer certificate={certificate} tutors={tutors} />
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-6 lg:col-start-1 lg:row-start-2">
        <CertificateSkills certificate={certificate} />
        <CertificateTasks certificate={certificate} />
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
  )
}
