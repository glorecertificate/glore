'use client'

import { useTranslations } from 'next-intl'

import { Badge } from '@/components/ui/badge'
import { type CertificateStatus } from '@/db/queries/certificate'
import { cn } from '@/lib/utils'

const STATUS_CONFIG: Record<CertificateStatus, { labelKey: string; className: string }> = {
  draft: { labelKey: 'statusDraft', className: 'bg-muted text-muted-foreground' },
  submitted: { labelKey: 'statusSubmitted', className: 'bg-info/15 text-info' },
  in_review: { labelKey: 'statusInReview', className: 'bg-warning/15 text-warning' },
  changes_requested: { labelKey: 'statusChangesRequested', className: 'bg-destructive/15 text-destructive' },
  approved: { labelKey: 'statusApproved', className: 'bg-success/15 text-success' },
}

interface CertificateStatusBadgeProps {
  status: CertificateStatus
  className?: string
}

export const CertificateStatusBadge = ({ className, status }: CertificateStatusBadgeProps) => {
  const t = useTranslations('Certificates')
  const config = STATUS_CONFIG[status]

  return (
    <Badge className={cn(config.className, className)} variant="ghost">
      {t(config.labelKey as Parameters<typeof t>[0])}
    </Badge>
  )
}
