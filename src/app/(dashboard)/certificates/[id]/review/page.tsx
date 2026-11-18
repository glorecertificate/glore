import { notFound, redirect } from 'next/navigation'
import { Suspense } from 'react'

import { loadCertificate, loadCertificateActivity, loadReviewContext } from '@/actions/certificates/detail-data'
import { getViewer } from '@/actions/viewer'
import { AgeBadge } from '@/components/features/certificates/age-badge'
import { CertificateStatusBadge } from '@/components/features/certificates/certificate-status-badge'
import { ReviewWorkspace } from '@/components/features/certificates/review/workspace'
import { ageTone, daysBetween } from '@/components/features/certificates/rules'
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
  const age = daysBetween(certificate.submittedAt ?? certificate.createdAt)

  return (
    <DashboardHeader
      description={
        <span className="flex flex-col gap-3">
          <span>{certificate.organization.name}</span>
          <span className="flex flex-wrap items-center gap-2">
            <CertificateStatusBadge status={certificate.status} />
            {certificate.isPending && <AgeBadge days={age} tone={ageTone(age)} />}
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
