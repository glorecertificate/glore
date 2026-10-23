'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { BanIcon, CheckIcon, MessageSquareWarningIcon, PlayIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

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
import { Banner } from '@/components/ui/banner'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { type Certificate } from '@/db/queries/certificate'
import { fullName } from '@/lib/utils'
import appConfig from '~/config/app.json'

type Busy = 'approve' | 'changes' | 'claim' | 'preview' | 'reject' | null

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
  const t = useTranslations('Certificates.review')
  const { push, refresh } = useRouter()
  const [busy, setBusy] = useState<Busy>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState(false)
  const canApprove = certificate.isSubmitted || certificate.isInReview
  const canRequestChanges = canApprove

  const form = useForm<ReviewFormValues>({
    defaultValues: reviewDefaults(certificate),
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
    <div className="flex flex-col gap-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">{fullName(holder)}</h1>
          <p className="text-sm text-muted-foreground">{certificate.organization.name}</p>
        </div>
        {certificate.isSubmitted && (
          <Button
            icon={PlayIcon}
            loading={busy === 'claim'}
            onClick={() => void claim()}
            type="button"
            variant="outline"
          >
            {t('startReview')}
          </Button>
        )}
      </div>

      {certificate.isChangesRequested && <Banner variant="warning">{t('waitingForVolunteer')}</Banner>}

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <RequestPanel certificate={certificate} holder={holder} previous={previous} results={results} />

        <Form {...form}>
          <div className="flex flex-col gap-8 rounded-xl border p-4 sm:p-6">
            <section aria-labelledby="experience-title" className="flex flex-col gap-4">
              <h3 className="text-sm font-semibold" id="experience-title">
                {t('experienceTitle')}
              </h3>
              <ExperienceFields />
              <SectionComment section="experience" />
              <TaskFields />
              <SectionComment section="tasks" />
            </section>

            <SkillsSection certificate={certificate} />
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

            <div className="sticky bottom-0 -mx-4 -mb-4 flex items-center justify-end gap-2 rounded-b-xl border-t bg-background/95 p-2 backdrop-blur-sm sm:-mx-6 sm:-mb-6 sm:flex-wrap sm:px-6 sm:py-4">
              <Button
                disabled={busy !== null}
                icon={BanIcon}
                onClick={() => setRejecting(true)}
                type="button"
                variant="ghost"
              >
                <span className="max-sm:sr-only">{t('reject')}</span>
              </Button>
              <Button
                disabled={busy !== null || !canRequestChanges}
                icon={MessageSquareWarningIcon}
                loading={busy === 'changes'}
                onClick={() => void requestChanges()}
                type="button"
                variant="outline"
              >
                <span className="max-sm:sr-only">{t('requestChanges')}</span>
              </Button>
              <Button
                className="max-sm:flex-1"
                disabled={busy !== null || !canApprove}
                icon={CheckIcon}
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
