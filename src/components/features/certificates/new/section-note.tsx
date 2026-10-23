'use client'

import { useTranslations } from 'next-intl'

import { LucideIcon } from '@/components/icons/lucide'
import { Banner } from '@/components/ui/banner'

export const SectionNote = ({ comment }: { comment?: string | null }) => {
  const t = useTranslations('Certificates.wizard')
  if (!comment) return null

  return (
    <Banner role="note" variant="warning">
      <LucideIcon name="message-square" className="mt-0.5 size-4 shrink-0 text-warning" />
      <div className="min-w-0 space-y-0.5">
        <p className="font-medium">{t('reviewerNote')}</p>
        <p className="whitespace-pre-wrap text-muted-foreground">{comment}</p>
      </div>
    </Banner>
  )
}
