import { notFound, redirect } from 'next/navigation'

import { findCertificate, findCertificateActivity, findReviewContext } from '@/actions/certificates/queries'
import { getCurrentUser } from '@/actions/user'
import { ReviewWorkspace } from '@/components/features/certificates/review/workspace'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageTitle } from '@/components/layout/page-title'

const ReviewPageContent = async ({ params }: { params: PageProps<'/certificates/[id]/review'>['params'] }) => {
  const { id } = await params
  const certificateId = Number(id)
  if (!certificateId || Number.isNaN(certificateId)) notFound()

  const [user, { data: certificate }] = await Promise.all([getCurrentUser(), findCertificate(certificateId)])
  if (!certificate) notFound()

  const reviewable = certificate.isSubmitted || certificate.isInReview || certificate.isChangesRequested
  if (certificate.reviewerId !== user.id || !reviewable) redirect(`/certificates/${certificate.id}`)

  const [{ data: context }, { data: activity }] = await Promise.all([
    findReviewContext(certificate.id),
    findCertificateActivity(certificate.id),
  ])
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

const ReviewPage = ({ params }: PageProps<'/certificates/[id]/review'>) => (
  <DashboardPage backHref="/certificates" title={<PageTitle name="reviewTitle" namespace="CertificateList" />}>
    <ReviewPageContent params={params} />
  </DashboardPage>
)

export default ReviewPage
