'use client'

import { useEffect, useState } from 'react'

import { useTranslations } from 'next-intl'

import { findCertificatePreview } from '@/actions/certificates/preview'
import { type CertificateInput } from '@/components/features/certificates/certificate-layout'
import { CertificatePage } from '@/components/features/certificates/certificate-page'
import { snapshotPdfInput } from '@/components/features/certificates/pdf-input'
import { useI18n } from '@/components/providers/i18n'
import { type Certificate } from '@/db/queries/certificate'

export const CertificatePreview = ({ certificate, className }: { certificate: Certificate; className?: string }) => {
  const t = useTranslations('CertificateDetail')
  const { localize } = useI18n()
  const { snapshot } = certificate
  const [loaded, setLoaded] = useState<{ data: CertificateInput; id: number } | null>(null)
  const { id } = certificate
  const issued = Boolean(snapshot)

  useEffect(() => {
    if (issued) return
    let active = true
    const load = async () => {
      const { data } = await findCertificatePreview(id)
      if (active && data) setLoaded({ data, id })
    }
    void load()
    return () => {
      active = false
    }
  }, [id, issued])

  const draft: CertificateInput = {
    activity: {
      duration: certificate.activityDuration || null,
      endDate: certificate.activityEndDate,
      location: certificate.activityLocation,
      startDate: certificate.activityStartDate,
      tasks: certificate.tasks,
    },
    code: certificate.code,
    holder: {
      birthPlace: null,
      birthday: null,
      firstName: certificate.holder?.firstName ?? '',
      lastName: certificate.holder?.lastName ?? null,
      nationality: null,
    },
    issuedAt: null,
    organization: {
      legalRepresentative: null,
      logoUrl: certificate.organization.avatarUrl,
      name: certificate.organization.name,
      signatureUrl: null,
    },
    skills: certificate.skills
      .toSorted((a, b) => a.sortOrder - b.sortOrder)
      .map(skill => ({
        description: null,
        icon: skill.course.icon,
        level: 0,
        name: skill.course.title ? localize(skill.course.title) : skill.course.slug,
        steps: 0,
      })),
  }

  const current = loaded?.id === id ? loaded.data : null

  return (
    <CertificatePage
      className={className}
      input={
        snapshot
          ? snapshotPdfInput(snapshot, certificate.code)
          : current
            ? { ...current, activity: draft.activity }
            : draft
      }
      label={t('previewLabel', { organization: certificate.organization.name })}
      labels={snapshot?.labels}
      language={snapshot?.language ?? certificate.language}
    />
  )
}
