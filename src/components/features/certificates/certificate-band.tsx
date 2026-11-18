import { notFound } from 'next/navigation'

import { getTranslations } from 'next-intl/server'

import { findCertificate } from '@/actions/certificates/queries'
import { getCurrentUser } from '@/actions/user'
import { CertificateActions } from '@/components/features/certificates/certificate-actions'
import { CertificateStatusBadge } from '@/components/features/certificates/certificate-status-badge'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { fullName } from '@/lib/utils'

export const CertificateBand = async ({ id }: { id: number }) => {
  const [{ data: certificate }, user, t, tOrg] = await Promise.all([
    findCertificate(id),
    getCurrentUser(),
    getTranslations('CertificateDetail'),
    getTranslations('CertificateOrg'),
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
          {holder && <span>{certificate.organization.name}</span>}
          <span className="flex flex-wrap items-center gap-2">
            <CertificateStatusBadge status={certificate.status} />
            {certificate.isHolderDeleted && <Badge variant="outline">{tOrg('holderDeleted')}</Badge>}
            {certificate.isApproved && certificate.isDefault && (
              <StatusBadge icon="star" tone="info">
                {t('featuredBadge')}
              </StatusBadge>
            )}
          </span>
          <span>{t(`statusMessage.${certificate.status}`)}</span>
        </span>
      }
      parent="certificates"
      title={holder ?? certificate.organization.name}
    />
  )
}
