'use client'

import { useTranslations } from 'next-intl'

import { useApplicationStep } from '@/components/features/organization/application/application-context'
import { LucideIcon } from '@/components/icons/lucide'
import { APPLICATION_STEPS } from '@/db/queries/organization-application'
import { cn } from '@/lib/utils'

export const ApplicationSteps = () => {
  const t = useTranslations('Register')
  const { stepIndex: current } = useApplicationStep()

  return (
    <ol
      aria-label={t('stepOf', { current: current + 1, total: APPLICATION_STEPS.length })}
      className="flex items-center gap-3"
    >
      {APPLICATION_STEPS.map((step, index) => {
        const done = index < current
        const active = index === current
        return (
          <li aria-current={active ? 'step' : undefined} className="flex items-center gap-2" key={step}>
            <span
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium text-muted-foreground',
                (done || active) && 'border-primary bg-primary text-primary-foreground'
              )}
            >
              {done ? <LucideIcon className="size-3.5" name="check" /> : index + 1}
            </span>
            <span className={cn('text-sm', active ? 'font-semibold text-foreground' : 'sr-only')}>
              {t(`step_${step}`)}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
