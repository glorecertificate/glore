import 'server-only'

import { eq } from 'drizzle-orm'

import { fetchLevelDescriptions } from '@/actions/courses/level-descriptions'
import { generateCertificatePdf } from '@/components/features/certificates/generate-pdf'
import { renderSnapshotSkill } from '@/components/features/certificates/snapshot'
import { db } from '@/db/client'
import { type SkillLevelDescriptionsByCourse, plainDescription } from '@/db/queries/skill-level-description'
import { type CertificateSnapshot, certificates } from '@/db/schema'
import { DEFAULT_LOCALE, type IntlRecord, LOCALES, localizeRecord } from '@/lib/i18n'

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

const regionName = (value: string | null, language: string) => {
  if (!value) return null
  if (!/^[a-z]{2}$/iu.test(value)) return value
  return new Intl.DisplayNames([language], { type: 'region' }).of(value.toUpperCase()) ?? value
}

export const renderCertificatePdf = async (snapshot: CertificateSnapshot, code: string | null) => {
  const locale = LOCALES.find(item => item === snapshot.language) ?? DEFAULT_LOCALE
  const { organization } = snapshot
  return await generateCertificatePdf(
    {
      activity: snapshot.activity,
      code,
      holder: { ...snapshot.holder, nationality: regionName(snapshot.holder.nationality, locale) },
      issuedAt: snapshot.issuedAt || null,
      organization: {
        legalRepresentative: organization.legalRepresentative,
        logoUrl: organization.logoUrl,
        name: organization.name,
        signatureUrl: organization.signatureUrl,
      },
      skills: snapshot.skills.map(skill => {
        const { description, label, level, steps } = renderSnapshotSkill(skill, snapshot.labels?.levels)
        return {
          description: description ? localizeRecord(description, locale, DEFAULT_LOCALE) : null,
          icon: skill.icon,
          level,
          levelLabel: label,
          name: localizeRecord(skill.name, locale, DEFAULT_LOCALE),
          steps,
        }
      }),
    },
    locale,
    snapshot.labels
  )
}

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
