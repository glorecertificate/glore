'use client'

import { useTranslations } from 'next-intl'

import { CertificateStatusBadge } from '@/components/features/certificates/certificate-status-badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PIPELINE_STATUSES, type Pipeline } from '@/db/queries/organization-insights'

export const OrganizationPipeline = ({ pipeline }: { pipeline: Pipeline }) => {
  const t = useTranslations('Organization')
  const total = PIPELINE_STATUSES.reduce((sum, status) => sum + pipeline[status], 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('pipelineTitle')}</CardTitle>
        <CardDescription>{t('pipelineDescription', { count: total })}</CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 && <p className="text-sm text-muted-foreground">{t('pipelineEmpty')}</p>}
        {total > 0 && (
          <ul className="space-y-2">
            {PIPELINE_STATUSES.map(status => (
              <li className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm" key={status}>
                <CertificateStatusBadge status={status} />
                <span className="font-medium tabular-nums">{pipeline[status]}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
