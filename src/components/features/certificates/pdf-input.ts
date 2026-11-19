import { type CertificateInput } from '@/components/features/certificates/certificate-layout'
import { regionName } from '@/components/features/certificates/region-name'
import { renderSnapshotSkill } from '@/components/features/certificates/snapshot'
import { type CertificateSnapshot } from '@/db/schema'
import { DEFAULT_LOCALE, LOCALES, localizeRecord } from '@/lib/i18n'

export const snapshotLocale = (snapshot: CertificateSnapshot) =>
  LOCALES.find(item => item === snapshot.language) ?? DEFAULT_LOCALE

export const snapshotPdfInput = (snapshot: CertificateSnapshot, code: string | null): CertificateInput => {
  const locale = snapshotLocale(snapshot)
  const { organization } = snapshot
  return {
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
  }
}
