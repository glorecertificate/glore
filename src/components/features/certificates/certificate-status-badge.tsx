'use client'

import { CircleAlertIcon, CircleCheckIcon, ClockIcon, FilePenLineIcon, SendIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Badge } from '@/components/ui/badge'
import { type CertificateStatus } from '@/db/queries/certificate'
import { type Icon } from '@/lib/types'
import { cn } from '@/lib/utils'

const STATUS_CONFIG: Record<CertificateStatus, { labelKey: string; className: string; icon: Icon }> = {
  draft: { labelKey: 'statusDraft', className: 'bg-muted text-muted-foreground', icon: FilePenLineIcon },
  submitted: { labelKey: 'statusSubmitted', className: 'bg-info/15 text-info', icon: SendIcon },
  in_review: { labelKey: 'statusInReview', className: 'bg-info/15 text-info', icon: ClockIcon },
  changes_requested: {
    labelKey: 'statusChangesRequested',
    className: 'bg-warning/15 text-warning',
    icon: CircleAlertIcon,
  },
  approved: { labelKey: 'statusApproved', className: 'bg-success/15 text-success', icon: CircleCheckIcon },
}

interface CertificateStatusBadgeProps {
  status: CertificateStatus
  className?: string
}

export const CertificateStatusBadge = ({ className, status }: CertificateStatusBadgeProps) => {
  const t = useTranslations('Certificates')
  const { className: statusClassName, icon: Icon, labelKey } = STATUS_CONFIG[status]

  return (
    <Badge className={cn('gap-1', statusClassName, className)} variant="ghost">
      <Icon className="size-3" />
      {t(labelKey as Parameters<typeof t>[0])}
    </Badge>
  )
}
