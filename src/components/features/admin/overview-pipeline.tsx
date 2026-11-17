import { useTranslations } from 'next-intl'

import { CertificateStatusBadge } from '@/components/features/certificates/certificate-status-badge'
import { CERTIFICATE_STATUS } from '@/components/features/certificates/status'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { PIPELINE_STATUSES, type Pipeline } from '@/db/queries/organization-insights'

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
                  <CertificateStatusBadge status={status} />
                  <span className="font-medium tabular-nums">{pipeline[status]}</span>
                </div>
                <Progress
                  aria-label={tCertificates(CERTIFICATE_STATUS[status].labelKey)}
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
