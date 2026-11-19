import { useTranslations } from 'next-intl'

import { type JourneyStepState, type JourneyWizardStep } from '@/actions/dashboard/core'
import { type WizardStep } from '@/components/features/certificates/rules'
import { LucideIcon } from '@/components/icons/lucide'
import { cn } from '@/lib/utils'

export const WIZARD_STEP_LABELS = {
  experience: 'stepsExperience',
  organization: 'stepsOrganization',
  review: 'stepsReview',
  skills: 'stepsSkills',
} as const satisfies Record<WizardStep, string>

const StepDot = ({ state }: { state: JourneyStepState }) => {
  if (state === 'done') return <LucideIcon aria-hidden className="size-3.5 shrink-0 text-earned-text" name="check" />
  if (state === 'flagged') {
    return <LucideIcon aria-hidden className="size-3.5 shrink-0 text-warning-text" name="circle-alert" />
  }
  return (
    <span
      aria-hidden
      className={cn(
        'size-3.5 shrink-0 rounded-full border',
        state === 'current' ? 'border-2 border-current-fill' : 'border-border-strong'
      )}
    />
  )
}

export const JourneySteps = ({ className, steps }: { className?: string; steps: JourneyWizardStep[] }) => {
  const t = useTranslations('Dashboard.journey')
  const tWizard = useTranslations('CertificateWizard')

  return (
    <ol
      aria-label={t('stepsLabel')}
      className={cn('grid grid-cols-[repeat(auto-fit,minmax(8.5rem,1fr))] gap-2', className)}
      data-slot="journey-steps"
    >
      {steps.map(({ key, state }) => (
        <li
          aria-current={state === 'current' ? 'step' : undefined}
          className={cn(
            'flex min-w-0 items-center gap-2.5 rounded-lg border bg-surface-0 px-3 py-2.5',
            state === 'current' ? 'border-current-fill' : 'border-border-subtle'
          )}
          key={key}
        >
          <StepDot state={state} />
          <span
            className={cn(
              'truncate type-caption',
              state === 'current' && 'font-medium text-fg-title',
              state === 'flagged' && 'font-medium text-fg-1',
              (state === 'done' || state === 'upcoming') && 'text-fg-2'
            )}
          >
            {tWizard(WIZARD_STEP_LABELS[key])}
          </span>
          {(state === 'done' || state === 'flagged') && <span className="sr-only">{t(`stepState.${state}`)}</span>}
        </li>
      ))}
    </ol>
  )
}
