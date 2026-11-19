import { useTranslations } from 'next-intl'

import { CertificateStatusBadge } from '@/components/features/certificates/certificate-status-badge'
import { CERTIFICATE_STATUS } from '@/components/features/certificates/status'
import { Card, CardAction, CardHeader, CardTitle } from '@/components/ui/card'
import { SkeletonText } from '@/components/ui/skeleton'
import { PIPELINE_STATUSES, type Pipeline } from '@/db/queries/organization-insights'

const FILLS = {
  approved: 'bg-status-approved',
  changes: 'bg-status-changes',
  draft: 'bg-status-draft',
  rejected: 'bg-status-rejected',
  review: 'bg-status-review',
  revoked: 'bg-status-revoked',
  submitted: 'bg-status-submitted',
  withdrawn: 'bg-status-withdrawn',
} as const

export const AdminOverviewPipeline = ({
  loading = false,
  pipeline,
  total,
}: {
  loading?: boolean
  pipeline: Pipeline
  total: number
}) => {
  const t = useTranslations('Admin.overview')
  const peak = Math.max(1, ...PIPELINE_STATUSES.map(status => pipeline[status]))
  const description = t('pipelineDescription', { count: total })

  return (
    <Card className="h-full" data-slot="admin-pipeline">
      <CardHeader>
        <CardTitle>{t('pipelineTitle')}</CardTitle>
        <CardAction className="type-caption text-fg-2">
          {loading ? <SkeletonText>{description}</SkeletonText> : description}
        </CardAction>
      </CardHeader>
      {total === 0 && <p className="text-sm text-muted-foreground">{t('pipelineEmpty')}</p>}
      {total > 0 && (
        <ul className="flex flex-col gap-3.5">
          {PIPELINE_STATUSES.map(status => (
            <li className="flex flex-col gap-1.5 text-sm" key={status}>
              <div className="flex items-center justify-between gap-3">
                <CertificateStatusBadge status={status} />
                <span className="font-medium tabular-nums">
                  {loading ? <SkeletonText>{pipeline[status]}</SkeletonText> : pipeline[status]}
                </span>
              </div>
              <span aria-hidden className="block h-1.5 overflow-hidden rounded-full bg-status-track">
                <span
                  className={`block h-full rounded-full ${FILLS[CERTIFICATE_STATUS[status].tone]}`}
                  style={{ width: `${(pipeline[status] / peak) * 100}%` }}
                />
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
