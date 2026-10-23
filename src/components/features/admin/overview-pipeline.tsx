import { useTranslations } from 'next-intl'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
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

export const AdminOverviewPipeline = ({ pipeline, total }: { pipeline: Pipeline; total: number }) => {
  const t = useTranslations('Admin.overview')
  const tCertificates = useTranslations('CertificateStatus')

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('pipelineTitle')}</CardTitle>
        <CardDescription>{t('pipelineDescription', { count: total })}</CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 && <p className="text-sm text-muted-foreground">{t('pipelineEmpty')}</p>}
        {total > 0 && (
          <ul className="space-y-3">
            {PIPELINE_STATUSES.map(status => (
              <li className="space-y-1.5 text-sm" key={status}>
                <div className="flex items-center justify-between gap-3">
                  <Badge variant={STATUS_VARIANTS[status]}>{tCertificates(STATUS_KEYS[status])}</Badge>
                  <span className="font-medium tabular-nums">{pipeline[status]}</span>
                </div>
                <Progress
                  aria-label={tCertificates(STATUS_KEYS[status])}
                  className="h-1.5"
                  color="brand"
                  value={(pipeline[status] / total) * 100}
                />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
