import { notFound, redirect } from 'next/navigation'

import {
  findCertificateActivity,
  getCertificateEligibility,
  listSkillReflections,
  listUserCertificates,
} from '@/actions/certificates/queries'
import { listCourses } from '@/actions/courses/queries'
import { getActiveOrgId, getCurrentUser } from '@/actions/user'
import { EligibilityPanel } from '@/components/features/certificates/eligibility-panel'
import { type SkillOption } from '@/components/features/certificates/new/values'
import { CertificateWizard } from '@/components/features/certificates/new/wizard'
import { DashboardPage } from '@/components/layout/dashboard-page'
import { PageTitle } from '@/components/layout/page-title'

const CertificatesNewContent = async ({ searchParams }: Pick<PageProps<'/certificates/new'>, 'searchParams'>) => {
  const { draft } = await searchParams
  const draftId = Number(Array.isArray(draft) ? draft[0] : draft)

  const [user, activeOrgId, eligibility, { data: certificates }, { data: courses }, reflections] = await Promise.all([
    getCurrentUser(),
    getActiveOrgId(),
    getCertificateEligibility(),
    listUserCertificates(),
    listCourses(),
    listSkillReflections(),
  ])

  const activeOrg = user.organizations.find(({ id }) => id === activeOrgId)
  if (activeOrg?.role !== 'volunteer') redirect('/certificates')

  const certificate = draftId ? (certificates?.find(({ id }) => id === draftId) ?? null) : null
  if (draftId && !certificate) notFound()
  if (certificate && !(certificate.isDraft || certificate.isChangesRequested)) {
    redirect(`/certificates/${certificate.id}`)
  }

  const open = certificates?.find(
    ({ id, isOpen, organization }) => isOpen && organization.id === activeOrgId && id !== certificate?.id
  )
  if (open) return <EligibilityPanel eligibility={eligibility} openRequestId={open.id} />
  if (!eligibility.eligible) return <EligibilityPanel eligibility={eligibility} />

  const skills: SkillOption[] = (courses ?? []).flatMap(({ completed, icon, id, slug, title, type }) =>
    type === 'skill' && completed
      ? [
          {
            icon: icon ?? null,
            id,
            reflection: reflections[id] ?? null,
            selfLevel: eligibility.selfLevels[id] ?? null,
            slug,
            title: title ?? null,
          },
        ]
      : []
  )

  const organization = certificate?.organization ?? activeOrg
  const notes = certificate?.isChangesRequested
    ? ((await findCertificateActivity(certificate.id)).data?.review ?? null)
    : null

  return (
    <CertificateWizard
      certificate={certificate}
      holder={{
        birthPlace: user.birthPlace,
        birthday: user.birthday,
        firstName: user.firstName,
        lastName: user.lastName,
        nationality: user.nationality,
      }}
      notes={notes}
      organization={{
        logoUrl: 'avatarUrl' in organization ? organization.avatarUrl : null,
        name: organization.name,
      }}
      skills={skills}
    />
  )
}

const CertificatesNewPage = (props: PageProps<'/certificates/new'>) => (
  <DashboardPage title={<PageTitle name="requestCertificateTitle" namespace="Certificates" />}>
    <CertificatesNewContent searchParams={props.searchParams} />
  </DashboardPage>
)

export default CertificatesNewPage
