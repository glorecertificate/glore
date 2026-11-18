'use client'

import { useTranslations } from 'next-intl'

import { type CertificateActivityEvent, type CertificateReviewNotes } from '@/actions/certificates/queries'
import { CertificateActions } from '@/components/features/certificates/certificate-actions'
import { CertificateCelebration } from '@/components/features/certificates/certificate-celebration'
import { CertificateFeedback } from '@/components/features/certificates/certificate-feedback'
import { CertificateJourney } from '@/components/features/certificates/certificate-journey'
import { CertificatePreview } from '@/components/features/certificates/certificate-preview'
import { CertificateReviewer, type OrgTutor } from '@/components/features/certificates/certificate-reviewer'
import { CertificateShare } from '@/components/features/certificates/certificate-share'
import { CertificateStatusBadge } from '@/components/features/certificates/certificate-status-badge'
import { CertificateSummary } from '@/components/features/certificates/certificate-summary'
import { CertificateTimeline } from '@/components/features/certificates/certificate-timeline'
import { LucideIcon } from '@/components/icons/lucide'
import { useSession } from '@/components/providers/session'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Image } from '@/components/ui/image'
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderDescription,
  PageHeaderHeading,
  PageHeaderTitle,
} from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { type Certificate } from '@/db/queries/certificate'
import { fullName } from '@/lib/utils'

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
  const t = useTranslations('CertificateOrg')
  const tDetail = useTranslations('CertificateDetail')
  const { user } = useSession()
  const isOwner = certificate.userId === user.id

  return (
    <div className="flex flex-col gap-6">
      {isOwner && certificate.isApproved && <CertificateCelebration id={certificate.id} />}

      <PageHeader>
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-card">
            {certificate.organization.avatarUrl ? (
              <Image
                alt=""
                className="size-full object-cover"
                height={48}
                src={certificate.organization.avatarUrl}
                unoptimized
                width={48}
              />
            ) : (
              <LucideIcon name="building-2" className="size-5 text-brand-text" />
            )}
          </div>
          <PageHeaderHeading>
            <PageHeaderTitle>{certificate.organization.name}</PageHeaderTitle>
            {!isOwner && certificate.holder && (
              <p className="text-sm text-muted-foreground">{fullName(certificate.holder)}</p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <CertificateStatusBadge status={certificate.status} />
              {certificate.isHolderDeleted && <Badge variant="outline">{t('holderDeleted')}</Badge>}
              {certificate.isApproved && certificate.isDefault && (
                <StatusBadge icon="star" tone="info">
                  {tDetail('featuredBadge')}
                </StatusBadge>
              )}
            </div>
            <PageHeaderDescription>{tDetail(`statusMessage.${certificate.status}`)}</PageHeaderDescription>
          </PageHeaderHeading>
        </div>
        <PageHeaderActions>
          <CertificateActions canManage={canManage} certificate={certificate} />
        </PageHeaderActions>
      </PageHeader>

      <CertificateJourney status={certificate.status} />

      {isOwner && verifyUrl && <CertificateShare certificate={certificate} url={verifyUrl} />}

      <CertificateFeedback certificate={certificate} notes={notes} />

      {!certificate.isDraft && (certificate.reviewerId || (certificate.isOpen && canManage)) && (
        <CertificateReviewer certificate={certificate} tutors={tutors} />
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <CertificatePreview certificate={certificate} className="lg:sticky lg:top-20" />
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
