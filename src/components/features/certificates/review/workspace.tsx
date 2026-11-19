'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'

import { findCertificatePreview } from '@/actions/certificates/preview'
import { type CertificateReviewNotes, type HolderCourseResult, type ReviewHolder } from '@/actions/certificates/queries'
import {
  approveCertificate,
  previewCertificatePdf,
  rejectCertificate,
  requestCertificateChanges,
} from '@/actions/certificates/review'
import { type CertificateInput } from '@/components/features/certificates/certificate-layout'
import { FieldError } from '@/components/features/certificates/field-error'
import { regionName } from '@/components/features/certificates/region-name'
import { EvaluationSection } from '@/components/features/certificates/review/evaluation-section'
import { PreviewDialog } from '@/components/features/certificates/review/preview-dialog'
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
import { type ReviewFormValues, reviewFormSchema } from '@/components/features/certificates/schemas'
import { useI18n } from '@/components/providers/i18n'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast'
import { type Certificate } from '@/db/queries/certificate'
import { SKILL_LEVELS } from '@/db/queries/skill-level-description'
import appConfig from '~/config/app.json'

const SECTIONS = ['experience', 'tasks', 'skills', 'personal'] as const

const SECTION_LABELS = {
  experience: 'sectionExperience',
  personal: 'sectionPersonal',
  skills: 'sectionSkills',
  tasks: 'sectionTasks',
} as const

type Busy = 'approve' | 'changes' | 'preview' | 'reject' | null

const emptyPreview: CertificateInput = {
  activity: { duration: null, endDate: null, location: null, startDate: null, tasks: [] },
  code: null,
  holder: { birthPlace: null, birthday: null, firstName: '', lastName: null, nationality: null },
  issuedAt: null,
  organization: { legalRepresentative: null, logoUrl: null, name: '', signatureUrl: null },
  skills: [],
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
  const { push } = useRouter()
  const [previewData, setPreviewData] = useState<CertificateInput | null>(null)
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

  const previewCertificate = (
    values: ReviewFormValues,
    signatory: CertificateInput['organization'] | null
  ): CertificateInput => ({
    activity: {
      duration: values.activityDuration || null,
      endDate: values.activityEndDate || null,
      location: values.activityLocation || null,
      startDate: values.activityStartDate || null,
      tasks: values.tasks.map(({ text }) => text),
    },
    code: certificate.code,
    holder: {
      birthPlace: holder.birthPlace,
      birthday: holder.birthday,
      firstName: certificate.holder?.firstName ?? '',
      lastName: certificate.holder?.lastName ?? null,
      nationality: regionName(holder.nationality, certificate.language),
    },
    issuedAt: null,
    organization: {
      legalRepresentative: signatory?.legalRepresentative ?? null,
      logoUrl: certificate.organization.avatarUrl,
      name: certificate.organization.name,
      signatureUrl: signatory?.signatureUrl ?? null,
    },
    skills: values.skills.flatMap(({ courseId, include, level }) => {
      const skill = certificate.skills.find(item => item.course.id === courseId)
      if (!include || !skill) return []
      const text = level ? results[courseId]?.descriptions[level] : null
      return [
        {
          description: text ? localize(text) : null,
          icon: skill.course.icon,
          level: level ? SKILL_LEVELS.indexOf(level) + 1 : 0,
          name: skill.course.title ? localize(skill.course.title) : skill.course.slug,
          steps: SKILL_LEVELS.length,
        },
      ]
    }),
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

  const preview = form.handleSubmit(async values => {
    const [{ data, error }, source] = await run('preview', () =>
      Promise.all([
        previewCertificatePdf(certificate.id, approvalPayload(values)),
        findCertificatePreview(certificate.id),
      ])
    )
    if (error || !data) return toast.error(failure(error?.code ?? ''))
    setPreviewData(previewCertificate(values, source.data?.organization ?? null))
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

  const decisions = (
    <div className="flex flex-col gap-2 bg-card lg:sticky lg:bottom-0 lg:-mx-6 lg:-mb-6 lg:border-t lg:px-6 lg:py-4">
      <Button
        disabled={busy !== null || !canApprove}
        icon="check"
        loading={busy === 'preview'}
        onClick={() => void preview()}
        type="button"
        variant="primary"
      >
        {t('approve')}
      </Button>
      <Button
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
        className="self-center text-destructive-text"
        disabled={busy !== null}
        onClick={() => setRejecting(true)}
        size="sm"
        type="button"
        variant="ghost"
      >
        {t('reject')}
      </Button>
    </div>
  )

  return (
    <div className="flex flex-col gap-6 max-lg:pb-20">
      <Form {...form}>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_25rem]">
          <div className="min-w-0">
            <RequestPanel certificate={certificate} holder={holder} previous={previous} results={results} />
          </div>

          <aside
            aria-labelledby="review-panel-title"
            className="flex flex-col gap-8 rounded-xl border border-border-subtle bg-card p-4 shadow-card sm:p-6 lg:sticky lg:top-20 lg:max-h-dialog lg:overflow-y-auto"
          >
            <h2 className="type-heading" id="review-panel-title">
              {t('panelTitle')}
            </h2>
            {certificate.isChangesRequested ? (
              <p className="rounded-lg bg-surface-muted p-3 text-sm text-muted-foreground">
                {t('waitingForVolunteer')}
              </p>
            ) : (
              <>
                <SkillsSection certificate={certificate} results={results} />
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
                <Collapsible className="flex flex-col gap-4">
                  <CollapsibleTrigger asChild>
                    <Button className="self-start text-action-text" size="text" type="button" variant="link">
                      {t('notesTitle')}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="flex flex-col gap-4">
                    {SECTIONS.map(section => (
                      <div className="flex flex-col gap-1" key={section}>
                        <p className="text-sm font-medium">{t(SECTION_LABELS[section])}</p>
                        <SectionComment section={section} />
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
                {decisions}
              </>
            )}
          </aside>
        </div>
      </Form>

      {canApprove && !certificate.isChangesRequested && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background px-4 pt-3 pb-bar-safe lg:hidden">
          <Button
            className="w-full"
            disabled={busy !== null}
            icon="check"
            loading={busy === 'preview'}
            onClick={() => void preview()}
            size="lg"
            type="button"
            variant="primary"
          >
            {t('approve')}
          </Button>
        </div>
      )}

      <PreviewDialog
        busy={busy === 'approve'}
        certificate={previewData ?? emptyPreview}
        language={certificate.language}
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
