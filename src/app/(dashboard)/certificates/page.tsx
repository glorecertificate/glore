import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import {
  getCertificateEligibility,
  listOrganizationCertificates,
  listTutorCertificates,
  listUnassignedOrgCertificates,
  listUserCertificates,
} from '@/actions/certificates/queries'
import { listOrgTutors } from '@/actions/organizations/queries'
import { getActiveOrgId, getCurrentUser } from '@/actions/user'
import { CertificatesContent } from '@/components/features/certificates/certificates-content'
import { OrganizationCertificates } from '@/components/features/certificates/organization-certificates'
import { TutorCertificatesContent } from '@/components/features/certificates/tutor-certificates-content'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageTitle } from '@/components/layout/page-title'

const CertificatesPageContent = async () => {
  const [user, activeOrgId] = await Promise.all([getCurrentUser(), getActiveOrgId()])
  if (user.isAdmin) redirect('/admin/certificates')
  const role = user.organizations.find(({ id }) => id === activeOrgId)?.role

  if (activeOrgId && (role === 'admin' || role === 'representative')) {
    const [{ data: certificates }, { data: tutors }] = await Promise.all([
      listOrganizationCertificates(activeOrgId),
      listOrgTutors(activeOrgId),
    ])
    return <OrganizationCertificates certificates={certificates ?? []} tutors={tutors ?? []} />
  }

  if (role === 'tutor') {
    const [{ data: assigned }, { data: unassigned }] = await Promise.all([
      listTutorCertificates({ cache: false }),
      listUnassignedOrgCertificates({ cache: false }),
    ])
    return <TutorCertificatesContent assigned={assigned ?? []} unassigned={unassigned ?? []} />
  }

  const [{ data: certificates }, eligibility] = await Promise.all([listUserCertificates(), getCertificateEligibility()])
  return <CertificatesContent certificates={certificates ?? []} eligibility={eligibility} />
}

const CertificatesBand = async () => {
  const [user, activeOrgId] = await Promise.all([getCurrentUser(), getActiveOrgId()])
  const role = user.organizations.find(({ id }) => id === activeOrgId)?.role
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
