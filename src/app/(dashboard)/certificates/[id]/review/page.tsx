import { notFound, redirect } from 'next/navigation'
import { connection } from 'next/server'
import { Suspense } from 'react'

import { getFormatter, getTranslations } from 'next-intl/server'

import { loadCertificate, loadCertificateActivity, loadReviewContext } from '@/actions/certificates/detail-data'
import { getViewer } from '@/actions/viewer'
import { CertificateStatusBadge } from '@/components/features/certificates/certificate-status-badge'
import { StartReviewButton } from '@/components/features/certificates/review/start-review'
import { ReviewWorkspace } from '@/components/features/certificates/review/workspace'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageTitle } from '@/components/layout/page-title'
import { fullName } from '@/lib/utils'

const ReviewPageContent = async ({ params }: { params: PageProps<'/certificates/[id]/review'>['params'] }) => {
  const { id } = await params
  const certificateId = Number(id)
  if (!certificateId || Number.isNaN(certificateId)) notFound()

  const [user, certificate, context, activity] = await Promise.all([
    getViewer(),
    loadCertificate(certificateId),
    loadReviewContext(certificateId),
    loadCertificateActivity(certificateId),
  ])
  if (!certificate) notFound()

  const reviewable = certificate.isSubmitted || certificate.isInReview || certificate.isChangesRequested
  if (certificate.reviewerId !== user.id || !reviewable) redirect(`/certificates/${certificate.id}`)

  if (!context) notFound()

  return (
    <ReviewWorkspace
      certificate={certificate}
      holder={context.holder}
      previous={activity?.review ?? null}
      results={context.results}
    />
  )
}

const ReviewBand = async ({ params }: { params: PageProps<'/certificates/[id]/review'>['params'] }) => {
  const { id } = await params
  const certificateId = Number(id)
  if (!certificateId || Number.isNaN(certificateId)) notFound()
  const certificate = await loadCertificate(certificateId)
  if (!certificate) notFound()
  await connection()
  const [format, t] = await Promise.all([getFormatter(), getTranslations('CertificateReview')])
  const submittedAt = certificate.submittedAt ?? certificate.createdAt

  return (
    <DashboardHeader
      actions={certificate.isSubmitted && <StartReviewButton id={certificate.id} />}
      description={
        <span className="flex flex-col gap-3">
          <span>{certificate.organization.name}</span>
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {!certificate.isSubmitted && <CertificateStatusBadge status={certificate.status} />}
            <span className="text-sm">{t('submittedAgo', { when: format.relativeTime(new Date(submittedAt)) })}</span>
          </span>
        </span>
      }
      parent="certificates"
      title={fullName(certificate.holder ?? {})}
    />
  )
}

const ReviewPage = ({ params }: PageProps<'/certificates/[id]/review'>) => (
  <DashboardPage
    overlap
    header={
      <Suspense
        fallback={
          <DashboardHeader parent="certificates" title={<PageTitle name="reviewTitle" namespace="CertificateList" />} />
        }
      >
        <ReviewBand params={params} />
      </Suspense>
    }
  >
    <ReviewPageContent params={params} />
  </DashboardPage>
)

export default ReviewPage
