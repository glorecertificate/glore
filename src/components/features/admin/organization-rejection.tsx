'use client'

import { useFormatter, useTranslations } from 'next-intl'

import { LucideIcon } from '@/components/icons/lucide'
import { Banner } from '@/components/ui/banner'
import { timestampMillis } from '@/db/queries/organization'
import { fullName } from '@/lib/utils'

interface AdminOrganizationRejectionRequest {
  reviewedAt: string | null
  reviewer?: { email: string; firstName: string | null; lastName: string | null } | null
  reviewerComment: string | null
}

export const AdminOrganizationRejection = ({ request }: { request: AdminOrganizationRejectionRequest | null }) => {
  const { dateTime } = useFormatter()
  const t = useTranslations('Admin.organizations')

  const date = request?.reviewedAt
    ? dateTime(new Date(timestampMillis(request.reviewedAt)), { dateStyle: 'long' })
    : null
  const reviewer = request?.reviewer ? fullName(request.reviewer) || request.reviewer.email : null
  const comment = request?.reviewerComment?.trim()
  const meta = date ? (reviewer ? t('rejectedBy', { date, name: reviewer }) : t('rejectedOn', { date })) : null

  return (
    <Banner className="mb-6" variant="destructive">
      <LucideIcon className="mt-0.5 size-4 shrink-0 text-danger-text" name="circle-x" />
      <div className="flex min-w-0 flex-col gap-1">
        <p className="font-medium">{t('rejectedTitle')}</p>
        <p className="text-muted-foreground">{t('rejectedNote')}</p>
        {meta && <p className="text-muted-foreground">{meta}</p>}
        {comment && <p className="wrap-anywhere whitespace-pre-wrap">{t('rejectedReason', { reason: comment })}</p>}
      </div>
    </Banner>
  )
}
