'use client'

import { useTranslations } from 'next-intl'

import { LucideIcon } from '@/components/icons/lucide'
import { type IconName } from '@/components/icons/registry'
import { Badge } from '@/components/ui/badge'
import { type CertificateStatus } from '@/db/queries/certificate'
import { cn } from '@/lib/utils'

const STATUS_CONFIG: Record<CertificateStatus, { labelKey: string; className: string; icon: IconName }> = {
  draft: { labelKey: 'statusDraft', className: 'bg-muted text-muted-foreground', icon: 'file-pen-line' },
  submitted: { labelKey: 'statusSubmitted', className: 'bg-info/15 text-info-text', icon: 'send' },
  in_review: { labelKey: 'statusInReview', className: 'bg-info/15 text-info-text', icon: 'clock' },
  changes_requested: {
    labelKey: 'statusChangesRequested',
    className: 'bg-warning/15 text-warning-text',
    icon: 'circle-alert',
  },
  approved: { labelKey: 'statusApproved', className: 'bg-success/15 text-success-text', icon: 'circle-check' },
  rejected: { labelKey: 'statusRejected', className: 'bg-destructive/15 text-destructive-text', icon: 'circle-x' },
  withdrawn: { labelKey: 'statusWithdrawn', className: 'bg-muted text-muted-foreground', icon: 'undo-2' },
  revoked: { labelKey: 'statusRevoked', className: 'bg-destructive/15 text-destructive-text', icon: 'ban' },
}

export const certificateStatusLabelKey = (status: CertificateStatus) => STATUS_CONFIG[status].labelKey

interface CertificateStatusBadgeProps {
  status: CertificateStatus
  className?: string
}

export const CertificateStatusBadge = ({ className, status }: CertificateStatusBadgeProps) => {
  const t = useTranslations('CertificateStatus')
  const { className: statusClassName, icon, labelKey } = STATUS_CONFIG[status]

  return (
    <Badge className={cn('gap-1', statusClassName, className)} variant="ghost">
      <LucideIcon name={icon} className="size-3" />
      {t(labelKey as Parameters<typeof t>[0])}
    </Badge>
  )
}
