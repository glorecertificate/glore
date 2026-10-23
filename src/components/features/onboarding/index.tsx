'use client'

import { useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { type Locale, useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { completeOnboarding } from '@/actions/onboarding'
import { AboutStep } from '@/components/features/onboarding/about-step'
import { ContactStep } from '@/components/features/onboarding/contact-step'
import { NameStep } from '@/components/features/onboarding/name-step'
import { PasswordStep } from '@/components/features/onboarding/password-step'
import {
  type OnboardingFormValues,
  STEP_FIELDS,
  STEP_NAMES,
  createOnboardingSchema,
} from '@/components/features/onboarding/schema'
import { WelcomeStep } from '@/components/features/onboarding/welcome-step'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Logo } from '@/components/ui/logo'
import { Progress } from '@/components/ui/progress'
import { type OnboardingNextStep } from '@/db/queries/onboarding'

const LAST_STEP = STEP_NAMES.length - 1

interface Completed {
  firstName: string
  nextStep: OnboardingNextStep
  username: string
}

export const OnboardingForm = ({
  email,
  firstName = '',
  lastName = '',
  locale = 'en',
}: {
  email: string
  firstName?: string
  lastName?: string
  locale?: Locale
}) => {
  const t = useTranslations('Onboarding')
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [completed, setCompleted] = useState<Completed | null>(null)

  const form = useForm<OnboardingFormValues>({
    defaultValues: {
      birthPlace: '',
      birthday: '',
      confirmPassword: '',
      firstName,
      lastName,
      nationality: '',
      password: '',
      phone: '',
      preferredLanguage: locale,
      termsAccepted: false,
    },
    mode: 'onTouched',
    resolver: zodResolver(createOnboardingSchema(t)),
  })

  const advance = async () => {
    if (!(await form.trigger(STEP_FIELDS[step]))) return
    setStep(current => Math.min(current + 1, LAST_STEP))
  }

  const submit = async (values: OnboardingFormValues) => {
    setSubmitting(true)
    try {
      const { data, error } = await completeOnboarding({
        birthPlace: values.birthPlace,
        birthday: values.birthday,
        firstName: values.firstName,
        lastName: values.lastName,
        locale: values.preferredLanguage,
        nationality: values.nationality,
        password: values.password,
        phone: values.phone,
        termsAccepted: values.termsAccepted,
      })
      if (error || !data) {
        toast.error(t(error?.code === 'ALREADY_ONBOARDED' ? 'alreadyOnboarded' : 'error'))
        return
      }
      setCompleted({ firstName: values.firstName.trim(), nextStep: data.nextStep, username: data.username })
    } catch {
      toast.error(t('error'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (step < LAST_STEP) {
      await advance()
      return
    }
    await form.handleSubmit(submit)()
  }

  if (completed) return <WelcomeStep {...completed} />

  const stepName = STEP_NAMES[step]!

  return (
    <>
      <div className="flex flex-col items-center gap-6">
        <Logo className="w-44" />
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">{t(`step_${stepName}_title`)}</h1>
          <p className="text-muted-foreground">{t(`step_${stepName}_description`)}</p>
        </div>
        <div className="w-full max-w-xs space-y-2">
          <Progress
            aria-label={t('progress', { current: step + 1, total: STEP_NAMES.length })}
            value={((step + 1) / STEP_NAMES.length) * 100}
          />
          <p className="text-center text-xs text-muted-foreground">
            {t('progress', { current: step + 1, total: STEP_NAMES.length })}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form className="space-y-6" noValidate onSubmit={handleSubmit}>
          {step === 0 && (
            <>
              <div className="space-y-2">
                <Label>{t('emailLabel')}</Label>
                <Input className="bg-muted/50" disabled value={email} />
              </div>
              <NameStep disabled={submitting} />
            </>
          )}
          {step === 1 && <AboutStep disabled={submitting} />}
          {step === 2 && <ContactStep disabled={submitting} locale={locale} />}
          {step === 3 && <PasswordStep disabled={submitting} />}

          <div className="flex gap-3">
            {step > 0 && (
              <Button
                className="flex-1"
                disabled={submitting}
                onClick={() => setStep(current => current - 1)}
                type="button"
                variant="outline"
              >
                {t('back')}
              </Button>
            )}
            <Button className="flex-1" disabled={submitting} loading={submitting} type="submit" variant="brand">
              {step < LAST_STEP ? t('next') : submitting ? t('submitting') : t('submit')}
            </Button>
          </div>
        </form>
      </Form>
    </>
  )
}
