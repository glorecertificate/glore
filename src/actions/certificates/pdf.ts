import 'server-only'

import { eq } from 'drizzle-orm'

import { generateCertificatePdf } from '@/components/features/certificates/generate-pdf'
import { db } from '@/db/client'
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

export const findCertificatePdfSource = async (id: number) =>
  await db.query.certificates.findFirst({ where: eq(certificates.id, id), with: pdfSourceWith })

type CertificatePdfSource = NonNullable<Awaited<ReturnType<typeof findCertificatePdfSource>>>

export const certificateSnapshot = (cert: CertificatePdfSource, issuedAt: string): CertificateSnapshot => ({
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
    .map(skill => ({
      courseId: skill.course.id,
      icon: skill.course.icon,
      level: skill.level ?? skill.selfLevel ?? 0,
      name: skill.course.title ?? ({ [DEFAULT_LOCALE]: skill.course.slug } as IntlRecord),
      statement: skill.statement,
    })),
  issuedAt,
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
      skills: snapshot.skills.map(skill => ({
        icon: skill.icon,
        level: skill.level,
        name: localizeRecord(skill.name, locale, DEFAULT_LOCALE),
        statement: skill.statement,
      })),
    },
    locale
  )
}

export const certificatePdf = async (id: number) => {
  const cert = await findCertificatePdfSource(id)
  if (!cert) return null
  const snapshot = cert.snapshot ?? certificateSnapshot(cert, cert.issuedAt ?? '')
  return { buffer: await renderCertificatePdf(snapshot, cert.code), handle: cert.handle }
}
