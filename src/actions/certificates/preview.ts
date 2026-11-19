'use server'

import 'server-only'

import { getAuthUser } from '@/actions/auth'
import { certificateAction } from '@/actions/certificates/helpers'
import { findHolderLevels } from '@/actions/certificates/holder-levels'
import { findCertificatePdfSource } from '@/actions/certificates/pdf'
import { findCertificate } from '@/actions/certificates/queries'
import { fetchLevelDescriptions } from '@/actions/courses/level-descriptions'
import { type CertificateInput } from '@/components/features/certificates/certificate-layout'
import { certificatePdfLabels } from '@/components/features/certificates/generate-pdf'
import { regionName } from '@/components/features/certificates/region-name'
import { CertificateError } from '@/db/mutations/certificate'
import { plainDescription } from '@/db/queries/skill-level-description'
import { DEFAULT_LOCALE, LOCALES, localizeRecord } from '@/lib/i18n'

export const findCertificatePreview = async (id: number) =>
  await certificateAction(async (): Promise<CertificateInput> => {
    const authUser = await getAuthUser()
    if (!authUser) throw new CertificateError('UNAUTHORIZED', 'Not authenticated')
    const certificateId = Number(id)
    const valid = Number.isInteger(certificateId) && certificateId > 0
    if (!valid) throw new CertificateError('NOT_FOUND', 'Certificate not found')
    const { data: visible } = await findCertificate(certificateId)
    if (!visible) throw new CertificateError('NOT_FOUND', 'Certificate not found')
    const cert = await findCertificatePdfSource(certificateId)
    if (!(cert?.userId && cert.user)) throw new CertificateError('NOT_FOUND', 'Certificate not found')

    const locale = LOCALES.find(item => item === cert.language) ?? DEFAULT_LOCALE
    const courseIds = cert.skills.map(({ course }) => course.id)
    const [levels, { data: descriptions }] = await Promise.all([
      findHolderLevels(cert.userId),
      fetchLevelDescriptions(courseIds),
    ])
    const profile = cert.organization.profile

    return {
      activity: {
        duration: cert.activityDuration || null,
        endDate: cert.activityEndDate,
        location: cert.activityLocation,
        startDate: cert.activityStartDate,
        tasks: cert.tasks,
      },
      code: cert.code,
      holder: {
        birthPlace: cert.user.birthPlace,
        birthday: cert.user.birthday,
        firstName: cert.user.firstName ?? '',
        lastName: cert.user.lastName,
        nationality: regionName(cert.user.nationality, locale),
      },
      issuedAt: null,
      organization: {
        legalRepresentative: profile?.legalRepresentative ?? null,
        logoUrl: profile?.avatarUrl ?? null,
        name: cert.organization.name,
        signatureUrl: profile?.signatureUrl ?? null,
      },
      skills: cert.skills
        .toSorted((a, b) => a.sortOrder - b.sortOrder)
        .map(({ course }) => {
          const level = levels[course.id]
          const text = level ? plainDescription(descriptions?.[course.id]?.[level]) : null
          return {
            description: text ? localizeRecord(text, locale, DEFAULT_LOCALE) || null : null,
            icon: course.icon,
            level: 0,
            name: course.title ? localizeRecord(course.title, locale, DEFAULT_LOCALE) : course.slug,
            steps: 0,
          }
        }),
    }
  })

export const fetchCertificateLabels = async (language: string) => await certificatePdfLabels(String(language))
