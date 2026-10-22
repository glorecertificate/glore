import 'server-only'

import { cache } from 'react'

import { and, eq, inArray } from 'drizzle-orm'

import { db } from '@/db/client'
import { type CertificateSnapshot, certificates } from '@/db/schema'
import { INTL_PLACEHOLDER, type IntlRecord } from '@/lib/i18n'
import { clientAddress, isRateLimited } from '@/lib/rate-limit'

const PUBLIC_STATUSES = ['approved', 'revoked'] as const

export interface Verification {
  activity: CertificateSnapshot['activity']
  code: string
  documentUrl: string | null
  holder: { firstName: string; lastName: string | null }
  issuedAt: string
  language: string
  organization: Pick<CertificateSnapshot['organization'], 'legalRepresentative' | 'logoUrl' | 'name' | 'signatureUrl'>
  revokedAt: string | null
  skills: { icon: string | null; level: number; name: IntlRecord; statement: string | null }[]
  status: 'revoked' | 'valid'
}

export type VerificationResult = ({ outcome: 'found' } & Verification) | { outcome: 'limited' } | { outcome: 'unknown' }

const toIntlRecord = (value: unknown): IntlRecord => ({
  ...INTL_PLACEHOLDER,
  ...(value && typeof value === 'object' ? value : {}),
})

const withholdRevokedDetails = (verification: Verification): Verification => {
  if (verification.status !== 'revoked') return verification
  return {
    ...verification,
    activity: { ...verification.activity, tasks: [] },
    documentUrl: null,
    organization: { ...verification.organization, legalRepresentative: null, signatureUrl: null },
    skills: [],
  }
}

const findVerification = async (code: string): Promise<Verification | null> => {
  const row = await db.query.certificates.findFirst({
    where: and(eq(certificates.code, code), inArray(certificates.status, [...PUBLIC_STATUSES])),
    with: {
      organization: { columns: { name: true }, with: { profile: { columns: { avatarUrl: true } } } },
      skills: { with: { course: { columns: { icon: true, title: true } } } },
      user: { columns: { firstName: true, lastName: true } },
    },
  })
  if (!row?.code) return null

  const snapshot = row.snapshot
  const status = row.status === 'revoked' ? 'revoked' : 'valid'
  const issuedAt = snapshot?.issuedAt ?? row.issuedAt ?? row.reviewedAt ?? row.createdAt

  if (snapshot) {
    return {
      activity: snapshot.activity,
      code: row.code,
      documentUrl: row.documentUrl,
      holder: { firstName: snapshot.holder.firstName, lastName: snapshot.holder.lastName },
      issuedAt,
      language: snapshot.language,
      organization: {
        legalRepresentative: snapshot.organization.legalRepresentative,
        logoUrl: snapshot.organization.logoUrl,
        name: snapshot.organization.name,
        signatureUrl: snapshot.organization.signatureUrl,
      },
      revokedAt: row.revokedAt,
      skills: snapshot.skills.map(skill => ({
        icon: skill.icon,
        level: skill.level,
        name: toIntlRecord(skill.name),
        statement: skill.statement,
      })),
      status,
    }
  }

  return {
    activity: {
      duration: row.activityDuration,
      endDate: row.activityEndDate,
      location: row.activityLocation,
      startDate: row.activityStartDate,
      tasks: row.tasks,
    },
    code: row.code,
    documentUrl: row.documentUrl,
    holder: { firstName: row.user.firstName, lastName: row.user.lastName },
    issuedAt,
    language: row.language,
    organization: {
      legalRepresentative: null,
      logoUrl: row.organization.profile?.avatarUrl ?? null,
      name: row.organization.name,
      signatureUrl: null,
    },
    revokedAt: row.revokedAt,
    skills: row.skills
      .toSorted((a, b) => a.sortOrder - b.sortOrder)
      .map(skill => ({
        icon: skill.course.icon,
        level: skill.level ?? skill.selfLevel ?? 1,
        name: toIntlRecord(skill.course.title),
        statement: skill.statement,
      })),
    status,
  }
}

export const findCertificateByCode = async (code: string) => {
  const verification = await findVerification(code)
  return verification && withholdRevokedDetails(verification)
}

export const verifyCertificate = cache(async (code: string): Promise<VerificationResult> => {
  const address = await clientAddress()
  if (await isRateLimited(`verify:${address}`, 60, 60_000)) return { outcome: 'limited' }

  const verification = await findCertificateByCode(code)
  return verification ? { outcome: 'found', ...verification } : { outcome: 'unknown' }
})

export const isLookupLimited = async () => await isRateLimited(`verify-lookup:${await clientAddress()}`, 30, 60_000)

export const findLegacyCertificateCode = async (username: string, handle: string) => {
  const row = await db.query.certificates.findFirst({
    columns: { code: true },
    where: and(eq(certificates.handle, handle), inArray(certificates.status, [...PUBLIC_STATUSES])),
    with: { user: { columns: { username: true } } },
  })
  return row?.code && row.user.username === username ? row.code : null
}
