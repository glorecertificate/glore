'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useEffectEvent, useRef, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { parseAsInteger, useQueryState } from 'nuqs'
import { type Control, useForm, useWatch } from 'react-hook-form'

import { type CertificateReviewNotes } from '@/actions/certificates/queries'
import {
  deleteCertificateDraft,
  resubmitCertificate,
  saveCertificateDraft,
  submitCertificate,
} from '@/actions/certificates/requests'
import { ExperienceStep } from '@/components/features/certificates/new/experience-step'
import { OrganizationStep } from '@/components/features/certificates/new/organization-step'
import { ReviewStep } from '@/components/features/certificates/new/review-step'
import { SkillsStep } from '@/components/features/certificates/new/skills-step'
import {
  type HolderProfile,
  type SkillOption,
  WIZARD_STEP_FIELDS,
  type WizardDraft,
  certificateWizardValues,
  emptyWizardValues,
  prefillValues,
  resumeStep,
  toEditValues,
} from '@/components/features/certificates/new/values'
import { WIZARD_STEPS, missingPersonalData } from '@/components/features/certificates/rules'
import { type PersonalDataValues, type WizardValues, wizardSchema } from '@/components/features/certificates/schemas'
import { type StepItem, StepList } from '@/components/features/certificates/step-list'
import { LucideIcon } from '@/components/icons/lucide'
import { useI18n } from '@/components/providers/i18n'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Banner } from '@/components/ui/banner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Form } from '@/components/ui/form'
import { Progress } from '@/components/ui/progress'
import { toast } from '@/components/ui/toast'
import { type Certificate } from '@/db/queries/certificate'
import { useDebounce } from '@/hooks/use-debounce'
import { useScrollReset } from '@/hooks/use-scroll-reset'
import appConfig from '~/config/app.json'

type SaveState = 'error' | 'idle' | 'limit' | 'saved' | 'saving'

const Autosave = ({
  control,
  onChange,
}: {
  control: Control<WizardValues>
  onChange: (values: WizardDraft) => void
}) => {
  const values = useWatch({ control })
  const debounced = useDebounce(values, 1200)
  const initial = useRef(true)
  const save = useEffectEvent(onChange)

  useEffect(() => {
    if (initial.current) {
      initial.current = false
      return
    }
    save(debounced)
  }, [debounced])

  return null
}

interface CertificateWizardProps {
  certificate: Certificate | null
  holder: HolderProfile & { firstName: string }
  notes: CertificateReviewNotes | null
  organization: { logoUrl: string | null; name: string }
  prefill?: Certificate | null
  skills: SkillOption[]
}

export const CertificateWizard = ({
  certificate,
  holder,
  notes,
  organization,
  prefill = null,
  skills,
}: CertificateWizardProps) => {
  const t = useTranslations('CertificateWizard')
  const { locale } = useI18n()
  const { push } = useRouter()
  const [, setDraftParam] = useQueryState('draft', parseAsInteger)
  const resubmit = certificate?.isChangesRequested ?? false
  const missing = missingPersonalData(holder)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [discarding, setDiscarding] = useState(false)
  const [exiting, setExiting] = useState(false)
  const [advancing, setAdvancing] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const draftId = useRef(certificate?.isDraft ? certificate.id : undefined)
  const latest = useRef<WizardDraft | null>(null)
  const dirty = useRef(false)
  const loop = useRef<Promise<void> | null>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const moved = useRef(false)

  const base = emptyWizardValues(locale, holder)
  const defaultValues = certificate
    ? certificateWizardValues(certificate, base)
    : prefill
      ? prefillValues(
          prefill,
          base,
          skills.map(({ id }) => id)
        )
      : base
  const [step, setStep] = useState(() => (certificate?.isDraft ? resumeStep(defaultValues, missing) : 0))
  const form = useForm<WizardValues>({
    defaultValues,
    mode: 'onTouched',
    resolver: zodResolver(wizardSchema(missing)),
  })

  useScrollReset(step)

  useEffect(() => {
    if (moved.current) heading.current?.focus({ preventScroll: true })
  }, [step])

  const skillsError: unknown = form.formState.errors.skills
  const skillsRootError = Boolean(skillsError) && !(Array.isArray(skillsError) && skillsError.some(Boolean))

  const focusSkills = useEffectEvent(() => {
    if (skillsRootError) document.getElementById('skills-list')?.focus()
  })

  useEffect(() => {
    if (attempts > 0) focusSkills()
  }, [attempts])

  const persist = async (values: WizardDraft) => {
    setSaveState('saving')
    const { data, error } = await saveCertificateDraft({ id: draftId.current, values: toEditValues(values) })
    if (error || !data) {
      setSaveState(error?.code === 'CONFLICT' && !draftId.current ? 'limit' : 'error')
      return
    }
    if (draftId.current !== data.id) {
      draftId.current = data.id
      await setDraftParam(data.id, { history: 'replace' })
    }
    setSaveState('saved')
  }

  const drain = async (): Promise<void> => {
    if (!(dirty.current && latest.current)) {
      loop.current = null
      return
    }
    dirty.current = false
    await persist(latest.current)
    return drain()
  }

  const flush = () => {
    dirty.current = true
    if (loop.current) return loop.current
    loop.current = drain()
    return loop.current
  }

  const { isDirty } = form.formState

  const autosave = (values: WizardDraft) => {
    if (resubmit || !(isDirty || draftId.current)) return
    latest.current = values
    void flush()
  }

  const goTo = (next: number) => {
    moved.current = true
    setStep(next)
  }

  const advance = async () => {
    setAdvancing(true)
    const valid = await form.trigger([...WIZARD_STEP_FIELDS[step]!], { shouldFocus: true })
    setAdvancing(false)
    if (!valid) {
      setAttempts(count => count + 1)
      return
    }
    goTo(step + 1)
  }

  const submitError = (code: string) => {
    if (code === 'ACTIVITY_TOO_SHORT') {
      return t('submitErrorsActivityTooShort', {
        hours: appConfig.minActivityHours,
        months: appConfig.minActivityMonths,
      })
    }
    if (code === 'PERSONAL_DATA_MISSING') return t('submitErrorsPersonalDataMissing')
    if (code === 'NOT_ELIGIBLE') return t('submitErrorsNotEligible')
    if (code === 'CONFLICT') return t('submitErrorsConflict')
    if (code === 'RATE_LIMITED') return t('submitErrorsRateLimited')
    return t('submitErrorsGeneric')
  }

  const onSubmit = async (values: WizardValues) => {
    if (step < WIZARD_STEPS.length - 1) {
      await advance()
      return
    }
    setSubmitting(true)
    try {
      const personal = missing.length > 0 ? personalPayload(values, missing) : undefined

      if (resubmit && certificate) {
        const result = await resubmitCertificate(certificate.id, toEditValues(values), personal)
        if (result.error) return toast.error(submitError(result.error.code))
        toast.success(t('resubmitted'))
        return push(`/certificates/${certificate.id}`)
      }

      latest.current = values
      await flush()
      const id = draftId.current
      if (!id) return toast.error(t('submitErrorsSaveFailed'))
      const result = await submitCertificate(id, personal)
      if (result.error) return toast.error(submitError(result.error.code))
      toast.success(t('submitted'))
      return push(`/certificates/${id}`)
    } finally {
      setSubmitting(false)
    }
  }

  const saveAndExit = async () => {
    setExiting(true)
    await flush()
    setExiting(false)
    push('/certificates')
  }

  const discard = async () => {
    if (!draftId.current) return push('/certificates')
    setDeleting(true)
    const { error } = await deleteCertificateDraft(draftId.current)
    setDeleting(false)
    if (error) return toast.error(t('discardError'))
    toast.success(t('discarded'))
    return push('/certificates')
  }

  const stepLabels = {
    experience: t('stepsExperience'),
    organization: t('stepsOrganization'),
    review: t('stepsReview'),
    skills: t('stepsSkills'),
  }
  const stepTitles = {
    experience: t('titlesExperience'),
    organization: t('titlesOrganization'),
    review: t('titlesReview'),
    skills: t('titlesSkills'),
  }
  const stepDescriptions = {
    experience: t('descriptionsExperience'),
    organization: t('descriptionsOrganization'),
    review: t('descriptionsReview'),
    skills: t('descriptionsSkills'),
  }
  const items: StepItem[] = WIZARD_STEPS.map((key, index) => ({
    key,
    label: stepLabels[key],
    state: index < step ? 'done' : index === step ? 'current' : 'upcoming',
  }))
  const last = step === WIZARD_STEPS.length - 1
  const comments = notes?.sectionComments ?? {}

  const saveLabel = {
    error: t('saveError'),
    idle: '',
    limit: t('draftLimit'),
    saved: t('saved'),
    saving: t('saving'),
  }[saveState]

  return (
    <div className="flex flex-col gap-4 max-sm:pb-24">
      <div className="flex flex-col gap-3">
        {!resubmit && (
          <div className="flex items-center justify-end gap-2">
            <output aria-live="polite" className="mr-auto text-xs text-muted-foreground">
              {saveLabel}
            </output>
            <Button
              disabled={submitting || deleting}
              loading={exiting}
              onClick={() => void saveAndExit()}
              size="sm"
              type="button"
              variant="outline"
            >
              {t('saveAndExit')}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label={t('moreActions')}
                  disabled={submitting || deleting}
                  size="icon-sm"
                  type="button"
                  variant="ghost"
                >
                  <LucideIcon name="ellipsis" className="text-white" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setDiscarding(true)} variant="destructive">
                  <LucideIcon name="trash-2" />
                  {t('discard')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <Card className="gap-6 p-4 sm:p-6">
        <div className="hidden sm:block">
          <StepList aria-label={t('stepsLabel')} items={items} />
        </div>
        <div className="flex flex-col gap-2 sm:hidden">
          <p className="text-sm font-medium">{t('stepOf', { current: step + 1, total: WIZARD_STEPS.length })}</p>
          <Progress aria-label={t('stepsLabel')} value={((step + 1) / WIZARD_STEPS.length) * 100} />
        </div>
        {resubmit && notes && (
          <Banner variant="warning">
            <div className="min-w-0 space-y-1">
              <p className="font-medium">{t('changesRequested')}</p>
              {notes.comment && <p className="whitespace-pre-wrap text-muted-foreground">{notes.comment}</p>}
            </div>
          </Banner>
        )}

        <Form {...form}>
          {!resubmit && <Autosave control={form.control} onChange={autosave} />}
          <form className="flex flex-col gap-6" method="post" noValidate onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-1">
              <h2 className="type-heading outline-none" ref={heading} tabIndex={-1}>
                {stepTitles[WIZARD_STEPS[step]!]}
              </h2>
              <p className="text-sm text-muted-foreground">{stepDescriptions[WIZARD_STEPS[step]!]}</p>
            </div>

            {step === 0 && <ExperienceStep comments={comments} />}
            {step === 1 && <SkillsStep comment={comments.skills} options={skills} />}
            {step === 2 && <OrganizationStep organization={organization.name} />}
            {step === 3 && (
              <ReviewStep
                comment={comments.personal}
                firstName={holder.firstName}
                lastName={holder.lastName}
                missing={missing}
                onChange={goTo}
                options={skills}
                organization={organization}
              />
            )}

            <div className="flex items-center justify-between gap-3 border-t pt-4 max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:z-20 max-sm:border-t max-sm:bg-background max-sm:px-4 max-sm:pt-3 max-sm:pb-bar-safe max-sm:*:min-h-11">
              {step > 0 ? (
                <Button
                  disabled={submitting}
                  icon="arrow-left"
                  onClick={() => goTo(step - 1)}
                  type="button"
                  variant="outline"
                >
                  {t('back')}
                </Button>
              ) : (
                <span />
              )}
              {last ? (
                <Button
                  icon="check"
                  key="submit"
                  loading={submitting}
                  loadingText={t('submitting')}
                  type="submit"
                  variant="primary"
                >
                  {resubmit ? t('resubmit') : t('submit')}
                </Button>
              ) : (
                <Button
                  icon="arrow-right"
                  iconPlacement="right"
                  key="next"
                  loading={advancing}
                  onClick={() => void advance()}
                  type="button"
                  variant="primary"
                >
                  {t('next')}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </Card>

      <AlertDialog onOpenChange={setDiscarding} open={discarding}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('discardTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('discardDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => void discard()}>{t('discard')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

const personalPayload = (values: WizardValues, missing: ReturnType<typeof missingPersonalData>): PersonalDataValues =>
  Object.fromEntries(missing.map(field => [field, values.personal[field].trim()]))
