'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useEffectEvent, useRef, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, Trash2Icon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { parseAsInteger, useQueryState } from 'nuqs'
import { type Control, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'

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
  type WizardDraft,
  certificateWizardValues,
  emptyWizardValues,
  toEditValues,
} from '@/components/features/certificates/new/values'
import { missingPersonalData } from '@/components/features/certificates/rules'
import { type PersonalDataValues, type WizardValues, wizardSchema } from '@/components/features/certificates/schemas'
import { type StepItem, StepList } from '@/components/features/certificates/step-list'
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Banner } from '@/components/ui/banner'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { type Certificate } from '@/db/queries/certificate'
import { useDebounce } from '@/hooks/use-debounce'
import appConfig from '~/config/app.json'

const STEPS = ['experience', 'skills', 'organization', 'review'] as const

const STEP_FIELDS = [
  ['activityStartDate', 'activityEndDate', 'activityDuration', 'activityLocation', 'tasks'],
  ['skills'],
  ['rating'],
  ['language', 'personal'],
] as const

type SaveState = 'error' | 'idle' | 'saved' | 'saving'

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
  skills: SkillOption[]
}

export const CertificateWizard = ({ certificate, holder, notes, organization, skills }: CertificateWizardProps) => {
  const t = useTranslations('Certificates.wizard')
  const { locale } = useI18n()
  const { push } = useRouter()
  const [, setDraftParam] = useQueryState('draft', parseAsInteger)
  const resubmit = certificate?.isChangesRequested ?? false
  const missing = missingPersonalData(holder)
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const draftId = useRef(certificate?.isDraft ? certificate.id : undefined)
  const latest = useRef<WizardDraft | null>(null)
  const dirty = useRef(false)
  const loop = useRef<Promise<void> | null>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const moved = useRef(false)

  const base = emptyWizardValues(locale, holder)
  const form = useForm<WizardValues>({
    defaultValues: certificate ? certificateWizardValues(certificate, base, skills) : base,
    mode: 'onTouched',
    resolver: zodResolver(wizardSchema(missing)),
  })

  useEffect(() => {
    if (moved.current) heading.current?.focus()
  }, [step])

  const persist = async (values: WizardDraft) => {
    setSaveState('saving')
    const { data, error } = await saveCertificateDraft({ id: draftId.current, values: toEditValues(values) })
    if (error || !data) {
      setSaveState('error')
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

  const autosave = (values: WizardDraft) => {
    if (resubmit) return
    latest.current = values
    void flush()
  }

  const goTo = (next: number) => {
    moved.current = true
    setStep(next)
  }

  const advance = async () => {
    if (await form.trigger([...STEP_FIELDS[step]!])) goTo(step + 1)
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
    setSubmitting(true)
    const personal = missing.length > 0 ? personalPayload(values, missing) : undefined

    if (resubmit && certificate) {
      const result = await resubmitCertificate(certificate.id, toEditValues(values), personal)
      setSubmitting(false)
      if (result.error) return toast.error(submitError(result.error.code))
      toast.success(t('resubmitted'))
      return push(`/certificates/${certificate.id}`)
    }

    latest.current = values
    await flush()
    const id = draftId.current
    if (!id) {
      setSubmitting(false)
      return toast.error(t('submitErrorsSaveFailed'))
    }
    const result = await submitCertificate(id, personal)
    setSubmitting(false)
    if (result.error) return toast.error(submitError(result.error.code))
    toast.success(t('submitted'))
    return push(`/certificates/${id}`)
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
  const items: StepItem[] = STEPS.map((key, index) => ({
    key,
    label: stepLabels[key],
    state: index < step ? 'done' : index === step ? 'current' : 'upcoming',
  }))
  const last = step === STEPS.length - 1
  const comments = notes?.sectionComments ?? {}

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 py-6">
      <StepList aria-label={t('stepsLabel')} items={items} />

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
        <form className="flex flex-col gap-6" noValidate onSubmit={form.handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold outline-none" ref={heading} tabIndex={-1}>
              {stepTitles[STEPS[step]!]}
            </h2>
            <p className="text-sm text-muted-foreground">{stepDescriptions[STEPS[step]!]}</p>
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
              options={skills}
              organization={organization}
            />
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <div className="flex items-center gap-3">
              <Button
                disabled={step === 0 || submitting}
                icon={ArrowLeftIcon}
                onClick={() => goTo(step - 1)}
                type="button"
                variant="outline"
              >
                {t('back')}
              </Button>
              {!resubmit && (
                <output aria-live="polite" className="text-xs text-muted-foreground">
                  {saveState === 'saving' && t('saving')}
                  {saveState === 'saved' && t('saved')}
                  {saveState === 'error' && t('saveError')}
                </output>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!resubmit && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button disabled={submitting || deleting} icon={Trash2Icon} type="button" variant="ghost">
                      {t('discard')}
                    </Button>
                  </AlertDialogTrigger>
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
              )}
              {last ? (
                <Button
                  icon={CheckIcon}
                  loading={submitting}
                  loadingText={t('submitting')}
                  type="submit"
                  variant="brand"
                >
                  {resubmit ? t('resubmit') : t('submit')}
                </Button>
              ) : (
                <Button
                  icon={ArrowRightIcon}
                  iconPlacement="right"
                  onClick={() => void advance()}
                  type="button"
                  variant="brand"
                >
                  {t('next')}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}

const personalPayload = (values: WizardValues, missing: ReturnType<typeof missingPersonalData>): PersonalDataValues =>
  Object.fromEntries(missing.map(field => [field, values.personal[field].trim()]))
