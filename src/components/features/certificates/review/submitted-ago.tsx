'use client'

import { useFormatter, useNow, useTranslations } from 'next-intl'

export const SubmittedAgo = ({ submittedAt }: { submittedAt: string }) => {
  const t = useTranslations('CertificateReview')
  const format = useFormatter()
  const now = useNow({ updateInterval: 60_000 })

  return (
    <time className="text-sm" dateTime={submittedAt} suppressHydrationWarning>
      {t('submittedAgo', { when: format.relativeTime(new Date(submittedAt), now) })}
    </time>
  )
}
