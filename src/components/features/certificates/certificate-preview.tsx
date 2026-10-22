'use client'

import { useTranslations } from 'next-intl'

import { CertificateThumbnail } from '@/components/features/certificates/certificate-thumbnail'
import { pdfDate } from '@/components/features/certificates/rules'
import { useI18n } from '@/components/providers/i18n'
import { type Certificate } from '@/db/queries/certificate'

export const CertificatePreview = ({ certificate, className }: { certificate: Certificate; className?: string }) => {
  const t = useTranslations('Certificates.detail')
  const { localize } = useI18n()

  return (
    <CertificateThumbnail
      className={className}
      code={certificate.code}
      end={pdfDate(certificate.activityEndDate)}
      firstName={certificate.user?.firstName ?? ''}
      hours={certificate.activityDuration || null}
      label={t('previewLabel', { organization: certificate.organization.name })}
      lastName={certificate.user?.lastName}
      location={certificate.activityLocation}
      logoUrl={certificate.organization.avatarUrl}
      organization={certificate.organization.name}
      skills={certificate.skills
        .toSorted((a, b) => a.sortOrder - b.sortOrder)
        .map(skill => ({
          level: skill.level ?? skill.selfLevel ?? 0,
          name: skill.course.title ? localize(skill.course.title) : skill.course.slug,
        }))}
      start={pdfDate(certificate.activityStartDate)}
      tasks={certificate.tasks}
    />
  )
}
