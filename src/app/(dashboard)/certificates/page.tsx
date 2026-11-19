import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { getTranslations } from 'next-intl/server'

import {
  loadCertificateEligibility,
  loadOrganizationCertificates,
  loadTutorCertificates,
  loadUnassignedCertificates,
  loadUserCertificates,
} from '@/actions/certificates/lists'
import { loadOrgTutors } from '@/actions/organizations/panel-data'
import { getViewerContext } from '@/actions/viewer'
import { CertificatesContent } from '@/components/features/certificates/certificates-content'
import { certificateWizardValues, emptyWizardValues, resumeStep } from '@/components/features/certificates/new/values'
import { OrganizationCertificates } from '@/components/features/certificates/organization-certificates'
import { missingPersonalData } from '@/components/features/certificates/rules'
import { TutorCertificatesContent } from '@/components/features/certificates/tutor-certificates-content'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageTitle } from '@/components/layout/page-title'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'

const CertificatesPageContent = async () => {
  const { orgId: activeOrgId, role, user } = await getViewerContext()
  if (user.isAdmin) redirect('/admin/certificates')

  if (activeOrgId && (role === 'admin' || role === 'representative')) {
    const [{ data: certificates }, { data: tutors }] = await Promise.all([
      loadOrganizationCertificates(activeOrgId),
      loadOrgTutors(activeOrgId),
    ])
    return <OrganizationCertificates certificates={certificates ?? []} tutors={tutors ?? []} />
  }

  if (role === 'tutor') {
    const [{ data: assigned }, { data: unassigned }] = await Promise.all([
      loadTutorCertificates(),
      loadUnassignedCertificates(),
    ])
    return <TutorCertificatesContent assigned={assigned ?? []} unassigned={unassigned ?? []} />
  }

  const [{ data: certificates }, eligibility] = await Promise.all([
    loadUserCertificates(),
    loadCertificateEligibility(),
  ])
  const missing = missingPersonalData(user)
  const draftSteps: Record<number, number> = {}
  for (const certificate of certificates ?? []) {
    if (!certificate.isDraft) continue
    draftSteps[certificate.id] = resumeStep(
      certificateWizardValues(certificate, emptyWizardValues(certificate.language, user)),
      missing
    )
  }
  return <CertificatesContent certificates={certificates ?? []} draftSteps={draftSteps} eligibility={eligibility} />
}

const RequestAction = async () => {
  const [{ data: certificates }, eligibility, t] = await Promise.all([
    loadUserCertificates(),
    loadCertificateEligibility(),
    getTranslations('CertificateList'),
  ])
  if (!eligibility.eligible || certificates?.some(({ isOpen }) => isOpen)) return null

  return (
    <Button asChild icon="plus" variant="primary">
      <Link href="/certificates/new">{t('requestCertificate')}</Link>
    </Button>
  )
}

const StartNextReview = async () => {
  const [{ data: assigned }, t] = await Promise.all([loadTutorCertificates(), getTranslations('CertificateQueue')])
  const next = (assigned ?? [])
    .filter(({ isInReview, isSubmitted }) => isSubmitted || isInReview)
    .toSorted(
      (a, b) => new Date(a.submittedAt ?? a.createdAt).getTime() - new Date(b.submittedAt ?? b.createdAt).getTime()
    )[0]
  if (!next) return null

  return (
    <Button asChild icon="clipboard-check" variant="band">
      <Link href={`/certificates/${next.id}/review`}>{t('startNext')}</Link>
    </Button>
  )
}

const CertificatesBand = async () => {
  const { orgId: activeOrgId, role } = await getViewerContext()
  const manager = activeOrgId && (role === 'admin' || role === 'representative')
  const volunteer = role === 'volunteer'
  const tutor = role === 'tutor'

  return (
    <DashboardHeader
      actions={(volunteer || tutor) && <Suspense>{tutor ? <StartNextReview /> : <RequestAction />}</Suspense>}
      description={
        manager ? null : <PageTitle name="description" namespace={tutor ? 'CertificateQueue' : 'CertificateList'} />
      }
      title={<PageTitle name="certificates" namespace="Layout" />}
    />
  )
}

const CertificatesPage = () => (
  <DashboardPage
    overlap
    header={
      <Suspense fallback={<DashboardHeader title={<PageTitle name="certificates" namespace="Layout" />} />}>
        <CertificatesBand />
      </Suspense>
    }
  >
    <CertificatesPageContent />
  </DashboardPage>
)

export default CertificatesPage
