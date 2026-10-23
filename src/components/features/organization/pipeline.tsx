'use client'

import { useTranslations } from 'next-intl'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PIPELINE_STATUSES, type Pipeline } from '@/db/queries/organization-insights'

const STATUS_KEYS = {
  approved: 'statusApproved',
  changes_requested: 'statusChangesRequested',
  in_review: 'statusInReview',
  rejected: 'statusRejected',
  revoked: 'statusRevoked',
  submitted: 'statusSubmitted',
  withdrawn: 'statusWithdrawn',
} as const satisfies Record<(typeof PIPELINE_STATUSES)[number], string>

const STATUS_VARIANTS = {
  approved: 'success',
  changes_requested: 'warning',
  in_review: 'info',
  rejected: 'destructive',
  revoked: 'destructive',
  submitted: 'info',
  withdrawn: 'muted',
} as const satisfies Record<(typeof PIPELINE_STATUSES)[number], React.ComponentProps<typeof Badge>['variant']>

export const OrganizationPipeline = ({ pipeline }: { pipeline: Pipeline }) => {
  const t = useTranslations('Organization')
  const tCertificates = useTranslations('CertificateStatus')
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
                <Badge variant={STATUS_VARIANTS[status]}>{tCertificates(STATUS_KEYS[status])}</Badge>
                <span className="font-medium tabular-nums">{pipeline[status]}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
