import 'server-only'

import { eq } from 'drizzle-orm'

import { fetchLevelDescriptions } from '@/actions/courses/level-descriptions'
import { generateCertificatePdf } from '@/components/features/certificates/generate-pdf'
import { snapshotLocale, snapshotPdfInput } from '@/components/features/certificates/pdf-input'
import { db } from '@/db/client'
import { type SkillLevelDescriptionsByCourse, plainDescription } from '@/db/queries/skill-level-description'
import { type CertificateSnapshot, certificates } from '@/db/schema'
import { DEFAULT_LOCALE, type IntlRecord } from '@/lib/i18n'

const pdfSourceWith = {
  organization: {
    columns: { id: true, name: true },
    with: { profile: { columns: { avatarUrl: true, legalRepresentative: true, signatureUrl: true } } },
  },
  skills: { with: { course: { columns: { icon: true, id: true, slug: true, title: true } } } },
  user: { columns: { birthPlace: true, birthday: true, firstName: true, lastName: true, nationality: true } },
} as const

const findCertificateWithSource = async (id: number) =>
  await db.query.certificates.findFirst({ where: eq(certificates.id, id), with: pdfSourceWith })

export const findCertificatePdfSource = async (id: number) => {
  const cert = await findCertificateWithSource(id)
  if (!cert?.user) return null
  return { ...cert, user: cert.user }
}

type CertificatePdfSource = NonNullable<Awaited<ReturnType<typeof findCertificatePdfSource>>>

export const certificateSnapshot = (
  cert: CertificatePdfSource,
  issuedAt: string,
  descriptions: SkillLevelDescriptionsByCourse,
  labels?: CertificateSnapshot['labels']
): CertificateSnapshot => ({
  holder: {
    birthPlace: cert.user.birthPlace,
    birthday: cert.user.birthday,
    firstName: cert.user.firstName ?? '',
    lastName: cert.user.lastName,
    nationality: cert.user.nationality,
  },
  organization: {
    id: cert.organization.id,
    legalRepresentative: cert.organization.profile?.legalRepresentative ?? null,
    logoUrl: cert.organization.profile?.avatarUrl ?? null,
    name: cert.organization.name,
    signatureUrl: cert.organization.profile?.signatureUrl ?? null,
  },
  activity: {
    duration: cert.activityDuration,
    endDate: cert.activityEndDate,
    location: cert.activityLocation,
    startDate: cert.activityStartDate,
    tasks: cert.tasks,
  },
  skills: cert.skills
    .toSorted((a, b) => a.sortOrder - b.sortOrder)
    .map(skill => {
      const level = skill.level ?? skill.selfLevel ?? 'intermediate'
      return {
        courseId: skill.course.id,
        description: plainDescription(descriptions[skill.course.id]?.[level]),
        icon: skill.course.icon,
        level,
        name: skill.course.title ?? ({ [DEFAULT_LOCALE]: skill.course.slug } as IntlRecord),
      }
    }),
  issuedAt,
  ...(labels && { labels }),
  language: cert.language,
})

export const renderCertificatePdf = async (snapshot: CertificateSnapshot, code: string | null) =>
  await generateCertificatePdf(snapshotPdfInput(snapshot, code), snapshotLocale(snapshot), snapshot.labels)

export const certificatePdf = async (id: number) => {
  const cert = await findCertificateWithSource(id)
  if (!cert) return null
  const descriptions = cert.snapshot
    ? {}
    : ((
        await fetchLevelDescriptions(
          cert.skills.map(({ courseId }) => courseId),
          { cache: false }
        )
      ).data ?? {})
  const snapshot =
    cert.snapshot ??
    (cert.user ? certificateSnapshot({ ...cert, user: cert.user }, cert.issuedAt ?? '', descriptions) : null)
  if (!snapshot) return null
  return { buffer: await renderCertificatePdf(snapshot, cert.code), handle: cert.handle }
}
