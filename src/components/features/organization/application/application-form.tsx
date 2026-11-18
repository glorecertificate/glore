'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useLocale, useTranslations } from 'next-intl'
import { type FieldErrors, type Resolver, useForm } from 'react-hook-form'

import { requestOrganizationRegistration } from '@/actions/organizations/requests'
import { TabHeader } from '@/components/features/organization/tab-header'
import { LucideIcon } from '@/components/icons/lucide'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { toast } from '@/components/ui/toast'
import {
  APPLICATION_ERROR_CODES,
  APPLICATION_STEPS,
  APPLICATION_STEP_FIELDS,
  type ApplicationErrorCode,
  type ApplicationInput,
  type ApplicationStep,
  applicationSchema,
} from '@/db/queries/organization-application'
import { AUTH_ROOT } from '@/lib/constants'

import { ApplicationSteps } from './application-steps'
import { CharterStep } from './charter-step'
import { MotivationStep } from './motivation-step'
import { OrganizationStep } from './organization-step'
import { RepresentativeStep } from './representative-step'

const DEFAULT_VALUES: ApplicationInput = {
  charterAccepted: false,
  city: '',
  contactEmail: '',
  contactName: '',
  country: '',
  email: '',
  firstName: '',
  lastName: '',
  legalName: '',
  motivation: '',
  name: '',
  registrantEmail: '',
  registryId: '',
  termsAccepted: false,
  url: '',
  volunteersPerYear: '',
}

const isErrorCode = (value: unknown): value is ApplicationErrorCode =>
  APPLICATION_ERROR_CODES.some(code => code === value)

export const ApplicationForm = () => {
  const locale = useLocale()
  const t = useTranslations('Register')
  const [stepIndex, setStepIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)
  const headingRef = useRef<HTMLDivElement>(null)
  const previousStep = useRef(0)

  const resolver: Resolver<ApplicationInput> = async (values, context, options) => {
    const result = await (zodResolver(applicationSchema) as unknown as Resolver<ApplicationInput>)(
      values,
      context,
      options
    )
    const errors = Object.fromEntries(
      Object.entries(result.errors).map(([name, error]) => [
        name,
        error && { ...error, message: isErrorCode(error.message) ? t(`error_${error.message}`) : t('error_required') },
      ])
    )
    return { ...result, errors } as typeof result
  }

  const form = useForm<ApplicationInput>({
    defaultValues: DEFAULT_VALUES,
    mode: 'onTouched',
    resolver,
  })

  const step = APPLICATION_STEPS[stepIndex] ?? 'organization'
  const isLast = stepIndex === APPLICATION_STEPS.length - 1

  useEffect(() => {
    if (previousStep.current === stepIndex) return
    previousStep.current = stepIndex
    headingRef.current?.focus()
  }, [stepIndex])

  const goTo = (target: ApplicationStep) => {
    setStepIndex(APPLICATION_STEPS.indexOf(target))
  }

  const handleNext = async () => {
    const valid = await form.trigger([...APPLICATION_STEP_FIELDS[step]], { shouldFocus: true })
    if (valid) setStepIndex(current => current + 1)
  }

  const handleInvalid = (errors: FieldErrors<ApplicationInput>) => {
    const invalid = APPLICATION_STEPS.find(item => APPLICATION_STEP_FIELDS[item].some(field => errors[field]))
    if (invalid) goTo(invalid)
  }

  const handleSubmit = async () => {
    if (!isLast) {
      await handleNext()
      return
    }
    setLoading(true)
    const input = form.getValues()
    const { error } = await requestOrganizationRegistration({ ...input, locale: locale as ApplicationInput['locale'] })
    setLoading(false)

    if (error) {
      toast.error(error.code === 'RATE_LIMITED' ? t('rateLimited') : t('submitError'))
      return
    }

    setSubmittedEmail(input.registrantEmail.trim())
  }

  if (submittedEmail) {
    return (
      <output className="flex flex-col items-center gap-6 rounded-xl border bg-card p-8 text-center shadow-2xs">
        <LucideIcon className="size-12 text-success-text" name="circle-check" />
        <div className="flex flex-col gap-2">
          <h2 className="type-heading">{t('successTitle')}</h2>
          <p className="text-sm wrap-anywhere text-muted-foreground">
            {t('successMessage', { email: submittedEmail })}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={AUTH_ROOT}>{t('goToLogin')}</Link>
        </Button>
      </output>
    )
  }

  return (
    <Form {...form}>
      <form className="flex flex-col gap-8" noValidate onSubmit={form.handleSubmit(handleSubmit, handleInvalid)}>
        <ApplicationSteps current={stepIndex} />

        <div className="outline-none" ref={headingRef} tabIndex={-1}>
          <TabHeader description={t(`description_${step}`)} title={t(`title_${step}`)} />
        </div>

        {step === 'organization' && <OrganizationStep form={form} />}
        {step === 'representative' && <RepresentativeStep form={form} />}
        {step === 'motivation' && <MotivationStep form={form} />}
        {step === 'charter' && <CharterStep form={form} onEdit={goTo} />}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            disabled={stepIndex === 0 || loading}
            onClick={() => setStepIndex(current => current - 1)}
            type="button"
            variant="ghost"
          >
            {t('back')}
          </Button>
          {isLast ? (
            <Button key="submit" loading={loading} loadingText={t('submitting')} type="submit">
              {t('submit')}
            </Button>
          ) : (
            <Button key="next" onClick={handleNext} type="button">
              {t('next')}
            </Button>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          {t('alreadyHaveAccount')}{' '}
          <Link className="underline underline-offset-4 hover:text-foreground" href={AUTH_ROOT}>
            {t('login')}
          </Link>
        </p>
      </form>
    </Form>
  )
}
