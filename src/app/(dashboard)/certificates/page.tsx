import { redirect } from 'next/navigation'
import { Suspense } from 'react'

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
import { OrganizationCertificates } from '@/components/features/certificates/organization-certificates'
import { TutorCertificatesContent } from '@/components/features/certificates/tutor-certificates-content'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageTitle } from '@/components/layout/page-title'

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
  return <CertificatesContent certificates={certificates ?? []} eligibility={eligibility} />
}

const CertificatesBand = async () => {
  const { orgId: activeOrgId, role } = await getViewerContext()
  const manager = activeOrgId && (role === 'admin' || role === 'representative')

  return (
    <DashboardHeader
      description={manager ? null : <PageTitle name="description" namespace="CertificateList" />}
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
