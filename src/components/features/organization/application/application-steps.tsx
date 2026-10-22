'use client'

import { useTranslations } from 'next-intl'

import { LucideIcon } from '@/components/icons/lucide'
import { APPLICATION_STEPS } from '@/db/queries/organization-application'
import { cn } from '@/lib/utils'

export const ApplicationSteps = ({ current }: { current: number }) => {
  const t = useTranslations('Register')

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {t('stepOf', { current: current + 1, total: APPLICATION_STEPS.length })}
      </p>
      <ol className="flex items-start gap-2">
        {APPLICATION_STEPS.map((step, index) => {
          const done = index < current
          const active = index === current
          return (
            <li aria-current={active ? 'step' : undefined} className="flex min-w-0 flex-1 flex-col gap-2" key={step}>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium',
                    done && 'border-brand bg-brand text-brand-foreground',
                    active && 'border-brand text-foreground',
                    !(done || active) && 'text-muted-foreground'
                  )}
                >
                  {done ? <LucideIcon className="size-3.5" name="check" /> : index + 1}
                </span>
                {index < APPLICATION_STEPS.length - 1 && (
                  <span aria-hidden className={cn('h-px flex-1 bg-border', done && 'bg-brand')} />
                )}
              </div>
              <p
                className={cn(
                  'pr-2 text-xs leading-tight wrap-break-word sm:text-sm',
                  active ? 'font-medium' : 'text-muted-foreground'
                )}
              >
                {t(`step_${step}`)}
              </p>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
