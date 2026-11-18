'use client'

import { useTranslations } from 'next-intl'

import { CertificateThumbnail } from '@/components/features/certificates/certificate-thumbnail'
import { pdfDate } from '@/components/features/certificates/rules'
import { issuedSkillRendering } from '@/components/features/certificates/snapshot'
import { useI18n } from '@/components/providers/i18n'
import { type Certificate } from '@/db/queries/certificate'
import { SKILL_LEVELS } from '@/db/queries/skill-level-description'

export const CertificatePreview = ({ certificate, className }: { certificate: Certificate; className?: string }) => {
  const t = useTranslations('CertificateDetail')
  const { localize } = useI18n()

  return (
    <CertificateThumbnail
      className={className}
      code={certificate.code}
      end={pdfDate(certificate.activityEndDate)}
      firstName={certificate.holder?.firstName ?? ''}
      hours={certificate.activityDuration || null}
      label={t('previewLabel', { organization: certificate.organization.name })}
      lastName={certificate.holder?.lastName}
      location={certificate.activityLocation}
      logoUrl={certificate.organization.avatarUrl}
      organization={certificate.organization.name}
      skills={certificate.skills
        .toSorted((a, b) => a.sortOrder - b.sortOrder)
        .map(skill => {
          const view = issuedSkillRendering(certificate.snapshot, skill.course.id, skill.level)
          return {
            level: view?.level ?? null,
            name: skill.course.title ? localize(skill.course.title) : skill.course.slug,
            steps: view?.steps ?? SKILL_LEVELS.length,
          }
        })}
      start={pdfDate(certificate.activityStartDate)}
      tasks={certificate.tasks}
    />
  )
}
