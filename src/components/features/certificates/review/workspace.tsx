'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'

import { type CertificateReviewNotes, type HolderCourseResult, type ReviewHolder } from '@/actions/certificates/queries'
import {
  approveCertificate,
  claimCertificateReview,
  previewCertificatePdf,
  rejectCertificate,
  requestCertificateChanges,
} from '@/actions/certificates/review'
import { ExperienceFields, TaskFields } from '@/components/features/certificates/experience-fields'
import { FieldError } from '@/components/features/certificates/field-error'
import { EvaluationSection } from '@/components/features/certificates/review/evaluation-section'
import { type PreviewCertificate, PreviewDialog } from '@/components/features/certificates/review/preview-dialog'
import { RejectDialog } from '@/components/features/certificates/review/reject-dialog'
import { RequestPanel } from '@/components/features/certificates/review/request-panel'
import { SectionComment } from '@/components/features/certificates/review/section-comment'
import { SkillsSection } from '@/components/features/certificates/review/skills-section'
import {
  approvalPayload,
  changesPayload,
  hasChangeRequest,
  reviewDefaults,
} from '@/components/features/certificates/review/values'
import { pdfDate } from '@/components/features/certificates/rules'
import { type ReviewFormValues, reviewFormSchema } from '@/components/features/certificates/schemas'
import { useI18n } from '@/components/providers/i18n'
import { Banner } from '@/components/ui/banner'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { SegmentedControlItem } from '@/components/ui/segmented-control-item'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast'
import { type Certificate } from '@/db/queries/certificate'
import { SKILL_LEVELS } from '@/db/queries/skill-level-description'
import { cn } from '@/lib/utils'
import appConfig from '~/config/app.json'

type View = 'request' | 'review'

type Busy = 'approve' | 'changes' | 'claim' | 'preview' | 'reject' | null

const emptyPreview: PreviewCertificate = {
  end: null,
  firstName: '',
  hours: null,
  location: null,
  organization: '',
  skills: [],
  start: null,
  tasks: [],
}

const decodePdf = (base64: string) => {
  const bytes = Uint8Array.from(atob(base64), char => char.charCodeAt(0))
  return URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }))
}

export const ReviewWorkspace = ({
  certificate,
  holder,
  previous,
  results,
}: {
  certificate: Certificate
  holder: ReviewHolder
  previous: CertificateReviewNotes | null
  results: Record<number, HolderCourseResult>
}) => {
  const t = useTranslations('CertificateReview')
  const { localize } = useI18n()
  const { push, refresh } = useRouter()
  const [view, setView] = useState<View>('review')
  const [previewData, setPreviewData] = useState<PreviewCertificate | null>(null)
  const [busy, setBusy] = useState<Busy>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState(false)
  const canApprove = certificate.isSubmitted || certificate.isInReview
  const canRequestChanges = canApprove

  const form = useForm<ReviewFormValues>({
    defaultValues: reviewDefaults(certificate, results),
    mode: 'onTouched',
    resolver: zodResolver(reviewFormSchema),
  })

  const failure = (code: string) => {
    if (code === 'ACTIVITY_TOO_SHORT') {
      return t('errorActivityTooShort', {
        hours: appConfig.minActivityHours,
        months: appConfig.minActivityMonths,
      })
    }
    if (code === 'INVALID_STATE') return t('errorInvalidState')
    if (code === 'STORAGE_FAILED') return t('errorStorage')
    if (code === 'RATE_LIMITED') return t('errorRateLimited')
    return t('errorGeneric')
  }

  const previewCertificate = (values: ReviewFormValues): PreviewCertificate => ({
    code: certificate.code,
    end: pdfDate(values.activityEndDate),
    firstName: certificate.holder?.firstName ?? '',
    hours: values.activityDuration || null,
    lastName: certificate.holder?.lastName,
    location: values.activityLocation,
    logoUrl: certificate.organization.avatarUrl,
    organization: certificate.organization.name,
    skills: values.skills.flatMap(({ courseId, include, level }) => {
      const skill = certificate.skills.find(item => item.course.id === courseId)
      if (!include || !skill) return []
      return [
        {
          level: level ? SKILL_LEVELS.indexOf(level) + 1 : null,
          name: skill.course.title ? localize(skill.course.title) : skill.course.slug,
          steps: SKILL_LEVELS.length,
        },
      ]
    }),
    start: pdfDate(values.activityStartDate),
    tasks: values.tasks.map(({ text }) => text),
  })

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
  }

  const run = async <T,>(kind: Busy, task: () => Promise<T>) => {
    setBusy(kind)
    try {
      return await task()
    } finally {
      setBusy(null)
    }
  }

  const claim = async () => {
    const { error } = await run('claim', () => claimCertificateReview(certificate.id))
    if (error) return toast.error(failure(error.code))
    toast.success(t('claimed'))
    return refresh()
  }

  const preview = form.handleSubmit(async values => {
    const { data, error } = await run('preview', () => previewCertificatePdf(certificate.id, approvalPayload(values)))
    if (error || !data) return toast.error(failure(error?.code ?? ''))
    setPreviewData(previewCertificate(values))
    return setPreviewUrl(decodePdf(data.pdf))
  })

  const approve = async () => {
    const { error } = await run('approve', () => approveCertificate(certificate.id, approvalPayload(form.getValues())))
    if (error) return toast.error(failure(error.code))
    closePreview()
    toast.success(t('approved'))
    return push(`/certificates/${certificate.id}`)
  }

  const requestChanges = async () => {
    const values = form.getValues()
    if (!hasChangeRequest(values)) {
      form.setError('comment', { message: 'commentRequired', type: 'custom' })
      return toast.error(t('changesNeedComment'))
    }
    const { error } = await run('changes', () => requestCertificateChanges(certificate.id, changesPayload(values)))
    if (error) return toast.error(failure(error.code))
    toast.success(t('changesRequested'))
    return push('/certificates')
  }

  const reject = async (reason: string) => {
    const { error } = await run('reject', () => rejectCertificate(certificate.id, { reason }))
    if (error) return toast.error(failure(error.code))
    toast.success(t('rejected'))
    return push('/certificates')
  }

  return (
    <div className="flex flex-col gap-6">
      {certificate.isChangesRequested && <Banner variant="warning">{t('waitingForVolunteer')}</Banner>}

      <SegmentedControl
        aria-label={t('viewLabel')}
        className="w-full lg:hidden"
        onValueChange={value => setView(value as View)}
        value={view}
      >
        {(['request', 'review'] as const).map(item => (
          <SegmentedControlItem
            className="relative flex-1 justify-center pointer-coarse:before:absolute pointer-coarse:before:inset-x-0 pointer-coarse:before:-inset-y-1.5"
            key={item}
            value={item}
          >
            {t(item === 'request' ? 'viewRequest' : 'viewReview')}
          </SegmentedControlItem>
        ))}
      </SegmentedControl>

      <div className="group grid items-start gap-6 lg:grid-cols-5" data-view={view}>
        <div className={cn('lg:col-span-2', view !== 'request' && 'max-lg:hidden')}>
          <RequestPanel certificate={certificate} holder={holder} previous={previous} results={results} />
        </div>

        <Form {...form}>
          <div className="flex flex-col gap-8 rounded-xl border border-border-subtle bg-card p-4 shadow-card max-lg:group-data-[view=request]:contents sm:p-6 lg:col-span-3">
            <div className="flex flex-col gap-8 max-lg:group-data-[view=request]:hidden">
              <section aria-labelledby="experience-title" className="flex flex-col gap-4">
                <h3 className="text-sm font-semibold" id="experience-title">
                  {t('experienceTitle')}
                </h3>
                <ExperienceFields />
                <SectionComment section="experience" />
                <TaskFields />
                <SectionComment section="tasks" />
              </section>

              <SkillsSection certificate={certificate} results={results} />
              <SectionComment section="skills" />

              <section aria-labelledby="personal-title" className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold" id="personal-title">
                  {t('personalTitle')}
                </h3>
                <SectionComment section="personal" />
              </section>

              <EvaluationSection />

              <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('comment')}</FormLabel>
                    <FormControl>
                      <Textarea className="min-h-24" placeholder={t('commentPlaceholder')} {...field} />
                    </FormControl>
                    <FieldError />
                  </FormItem>
                )}
              />
            </div>

            <div className="sticky bottom-0 -mx-4 -mb-4 flex flex-wrap items-center justify-end gap-2 rounded-b-xl border-t bg-card p-2 shadow-card max-lg:group-data-[view=request]:m-0 max-lg:group-data-[view=request]:rounded-xl max-lg:group-data-[view=request]:border sm:-mx-6 sm:-mb-6 sm:px-6 sm:py-4">
              {certificate.isSubmitted && (
                <Button
                  className="mr-auto max-sm:basis-full"
                  icon="play"
                  loading={busy === 'claim'}
                  onClick={() => void claim()}
                  type="button"
                  variant="outline"
                >
                  {t('startReview')}
                </Button>
              )}
              <Button
                className="max-sm:flex-1"
                disabled={busy !== null}
                icon="ban"
                onClick={() => setRejecting(true)}
                type="button"
                variant="ghost"
              >
                {t('reject')}
              </Button>
              <Button
                className="max-sm:flex-1"
                disabled={busy !== null || !canRequestChanges}
                icon="message-square-warning"
                loading={busy === 'changes'}
                onClick={() => void requestChanges()}
                type="button"
                variant="outline"
              >
                {t('requestChanges')}
              </Button>
              <Button
                className="max-sm:flex-1"
                disabled={busy !== null || !canApprove}
                icon="check"
                loading={busy === 'preview'}
                onClick={() => void preview()}
                type="button"
                variant="brand"
              >
                {t('approve')}
              </Button>
            </div>
          </div>
        </Form>
      </div>

      <PreviewDialog
        busy={busy === 'approve'}
        certificate={previewData ?? emptyPreview}
        onConfirm={() => void approve()}
        onOpenChange={open => {
          if (!open) closePreview()
        }}
        url={previewUrl}
      />
      <RejectDialog
        busy={busy === 'reject'}
        onConfirm={reason => void reject(reason)}
        onOpenChange={setRejecting}
        open={rejecting}
      />
    </div>
  )
}
