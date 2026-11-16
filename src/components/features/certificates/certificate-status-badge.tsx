'use client'

import { useTranslations } from 'next-intl'

import { CERTIFICATE_STATUS } from '@/components/features/certificates/status'
import { StatusBadge } from '@/components/ui/status-badge'
import { type CertificateStatus } from '@/db/queries/certificate'

interface CertificateStatusBadgeProps {
  className?: string
  status: CertificateStatus
}

export const CertificateStatusBadge = ({ className, status }: CertificateStatusBadgeProps) => {
  const t = useTranslations('CertificateStatus')
  const { icon, labelKey, tone } = CERTIFICATE_STATUS[status]

  return (
    <StatusBadge className={className} icon={icon} tone={tone}>
      {t(labelKey)}
    </StatusBadge>
  )
}
