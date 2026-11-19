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
    <>
      <p className="flex flex-wrap gap-x-2 self-start pb-1 text-sm text-sidebar-muted lg:hidden">
        <span>{t('stepOf', { current: current + 1, total: APPLICATION_STEPS.length })}</span>
        <span className="font-medium text-band-foreground">
          {t(`step_${APPLICATION_STEPS[current] ?? APPLICATION_STEPS[0]}`)}
        </span>
      </p>
      <ol
        aria-label={t('stepOf', { current: current + 1, total: APPLICATION_STEPS.length })}
        className="hidden flex-col gap-5 lg:flex"
      >
        {APPLICATION_STEPS.map((step, index) => {
          const done = index < current
          const active = index === current
          return (
            <li aria-current={active ? 'step' : undefined} className="flex items-center gap-3" key={step}>
              <span
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full border border-band-border text-xs font-medium text-sidebar-muted',
                  done && 'border-sidebar-primary bg-sidebar-primary text-sidebar-primary-foreground',
                  active && 'border-sidebar-primary bg-sidebar-primary text-sidebar-primary-foreground'
                )}
              >
                {done ? <LucideIcon className="size-3.5" name="check" /> : index + 1}
              </span>
              <span className={cn('text-sm', active ? 'font-semibold text-band-foreground' : 'text-sidebar-muted')}>
                {t(`step_${step}`)}
              </span>
            </li>
          )
        })}
      </ol>
    </>
  )
}
