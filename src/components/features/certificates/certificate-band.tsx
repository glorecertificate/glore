import { notFound } from 'next/navigation'

import { getTranslations } from 'next-intl/server'

import { loadCertificate } from '@/actions/certificates/detail-data'
import { getViewer } from '@/actions/viewer'
import { CertificateActions } from '@/components/features/certificates/certificate-actions'
import { CertificateStatusBadge } from '@/components/features/certificates/certificate-status-badge'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { fullName } from '@/lib/utils'

export const CertificateBand = async ({ id }: { id: number }) => {
  const [certificate, user, t, tList] = await Promise.all([
    loadCertificate(id),
    getViewer(),
    getTranslations('CertificateDetail'),
    getTranslations('CertificateList'),
  ])
  if (!certificate) notFound()

  const isOwner = certificate.userId === user.id
  const canManage =
    user.isAdmin ||
    user.organizations.some(
      ({ id: orgId, role }) => orgId === certificate.organizationId && (role === 'admin' || role === 'representative')
    )
  const holder = !isOwner && certificate.holder ? fullName(certificate.holder) : null

  return (
    <DashboardHeader
      actions={<CertificateActions canManage={canManage} certificate={certificate} />}
      description={
        <span className="flex flex-col gap-3">
          <span>{holder ? `${holder} · ${certificate.organization.name}` : certificate.organization.name}</span>
          <span className="flex flex-wrap items-center gap-2">
            <CertificateStatusBadge status={certificate.status} />
            {certificate.isApproved && certificate.isDefault && (
              <StatusBadge tone="info">{t('featuredBadge')}</StatusBadge>
            )}
          </span>
          <span>{t(`statusMessage.${certificate.status}`)}</span>
        </span>
      }
      parent="certificates"
      title={tList('itemTitle')}
    />
  )
}
