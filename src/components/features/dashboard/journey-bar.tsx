import { useTranslations } from 'next-intl'

import { type VolunteerJourney } from '@/actions/dashboard/core'
import { JourneyMarker } from '@/components/features/dashboard/journey-marker'
import { JourneySteps } from '@/components/features/dashboard/journey-steps'
import { LucideIcon } from '@/components/icons/lucide'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

export const JourneyBar = ({ className, journey }: { className?: string; journey: VolunteerJourney }) => {
  const t = useTranslations('Dashboard.journey')
  const { current, phase, stages, steps } = journey

  return (
    <section
      aria-labelledby="journey-bar-title"
      className={cn('flex flex-col gap-4 rounded-xl bg-card p-4 shadow-card', className)}
      data-slot="journey-bar"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="type-heading text-fg-title" id="journey-bar-title">
          {t('title')}
        </h2>
        <p className="type-caption text-fg-2">{t('position', { current: current + 1, total: stages.length })}</p>
      </div>
      <ol className="grid grid-cols-4">
        {stages.map(({ key, state }, index) => (
          <li
            aria-current={state === 'current' ? 'step' : undefined}
            className="relative flex min-w-0 flex-col items-center gap-1.5 text-center"
            key={key}
          >
            {index < stages.length - 1 && (
              <span aria-hidden className="absolute top-2.75 left-1/2 w-full px-4">
                <span className="block h-0.5 overflow-hidden rounded-full bg-border">
                  <span
                    className={cn(
                      'block size-full origin-left bg-earned transition-transform duration-240 ease-out motion-reduce:transition-none',
                      state === 'done' ? 'scale-x-100' : 'scale-x-0'
                    )}
                  />
                </span>
              </span>
            )}
            <JourneyMarker state={state} tone={phase === 'withdrawn' ? 'neutral' : 'danger'} />
            <span
              className={cn(
                'max-w-full truncate type-caption',
                state === 'current' ? 'font-semibold text-fg-title' : 'text-fg-2'
              )}
            >
              {t(`stages.${key}`)}
            </span>
          </li>
        ))}
      </ol>
      {steps.length > 0 && (
        <Collapsible className="-mx-1 border-t border-border-subtle pt-2">
          <CollapsibleTrigger asChild>
            <Button className="group w-full justify-between" size="sm" variant="ghost">
              {t('stepsToggle')}
              <LucideIcon
                className="transition-transform duration-200 ease-out group-data-[state=open]:rotate-180 motion-reduce:transition-none"
                name="chevron-down"
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <JourneySteps className="px-3 pt-2 pb-1" steps={steps} />
          </CollapsibleContent>
        </Collapsible>
      )}
    </section>
  )
}
