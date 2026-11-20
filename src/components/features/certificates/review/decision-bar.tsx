'use client'

import { useTranslations } from 'next-intl'
import { useFormContext, useWatch } from 'react-hook-form'

import { type ReviewFormValues } from '@/components/features/certificates/schemas'
import { Button } from '@/components/ui/button'

type Busy = 'approve' | 'changes' | 'preview' | 'reject' | null

const SCORE_COUNT = 4

export const DecisionBar = ({
  busy,
  disabled,
  onApprove,
  onReject,
  onRequestChanges,
}: {
  busy: Busy
  disabled: boolean
  onApprove: () => void
  onReject: () => void
  onRequestChanges: () => void
}) => {
  const t = useTranslations('CertificateReview')
  const { control } = useFormContext<ReviewFormValues>()
  const [scores, skills] = useWatch({ control, name: ['scores', 'skills'] })
  const included = skills.filter(skill => skill.include)

  return (
    <div className="z-20 flex flex-col gap-4 rounded-xl border border-border-subtle bg-card p-4 shadow-md md:sticky md:bottom-4 md:flex-row md:flex-wrap md:items-center md:justify-between md:px-6">
      <div className="flex min-w-60 flex-1 flex-col gap-0.5">
        <p aria-live="polite" className="text-sm font-semibold tabular-nums">
          {t('decisionProgress', {
            levels: included.filter(skill => skill.level).length,
            scores: Object.values(scores ?? {}).filter(value => value !== null && value !== undefined).length,
            skills: included.length,
            total: SCORE_COUNT,
          })}
        </p>
        <p className="text-xs text-muted-foreground">{t('decisionNote')}</p>
      </div>
      <div className="flex flex-col-reverse gap-2 md:flex-row md:items-center md:gap-3">
        <Button
          className="text-destructive-text hover:not-disabled:bg-destructive/10"
          disabled={busy !== null}
          onClick={onReject}
          type="button"
          variant="ghost"
        >
          {t('reject')}
        </Button>
        <Button
          disabled={busy !== null || disabled}
          icon="message-square-warning"
          loading={busy === 'changes'}
          onClick={onRequestChanges}
          size="lg"
          type="button"
          variant="outline"
        >
          {t('requestChanges')}
        </Button>
        <Button
          disabled={busy !== null || disabled}
          icon="check"
          loading={busy === 'preview'}
          onClick={onApprove}
          size="lg"
          type="button"
          variant="primary"
        >
          {t('approve')}
        </Button>
      </div>
    </div>
  )
}
