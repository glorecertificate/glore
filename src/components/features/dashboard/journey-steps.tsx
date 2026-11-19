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
  if (state === 'current') {
    return (
      <span aria-hidden className="flex size-3.5 shrink-0 items-center justify-center">
        <span className="size-2 rounded-full bg-current-fill" />
      </span>
    )
  }
  return <span aria-hidden className="size-3.5 shrink-0 rounded-full border border-border-strong" />
}

export const JourneySteps = ({ className, steps }: { className?: string; steps: JourneyWizardStep[] }) => {
  const t = useTranslations('Dashboard.journey')
  const tWizard = useTranslations('CertificateWizard')

  return (
    <ol
      aria-label={t('stepsLabel')}
      className={cn('flex flex-col rounded-lg bg-surface-muted px-3 py-1.5', className)}
      data-slot="journey-steps"
    >
      {steps.map(({ key, state }) => (
        <li
          aria-current={state === 'current' ? 'step' : undefined}
          className="flex h-7.5 min-w-0 items-center gap-2.5"
          key={key}
        >
          <StepDot state={state} />
          <span
            className={cn(
              'truncate type-label',
              state === 'current' && 'font-semibold text-action-text',
              state === 'flagged' && 'font-medium text-fg-1',
              state === 'done' && 'text-fg-1',
              state === 'upcoming' && 'text-fg-2'
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
