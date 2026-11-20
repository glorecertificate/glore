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
import { regionName } from '@/components/features/certificates/region-name'
import { CommentSection } from '@/components/features/certificates/review/comment-section'
import { DecisionBar } from '@/components/features/certificates/review/decision-bar'
import { EvaluationSection } from '@/components/features/certificates/review/evaluation-section'
import { PreviewDialog } from '@/components/features/certificates/review/preview-dialog'
import { RejectDialog } from '@/components/features/certificates/review/reject-dialog'
import { RequestPanel } from '@/components/features/certificates/review/request-panel'
import { SkillsSection } from '@/components/features/certificates/review/skills-section'
import {
  approvalPayload,
  changesPayload,
  hasChangeRequest,
  reviewDefaults,
} from '@/components/features/certificates/review/values'
import { type ReviewFormValues, reviewFormSchema } from '@/components/features/certificates/schemas'
import { useI18n } from '@/components/providers/i18n'
import { Banner } from '@/components/ui/banner'
import { Card } from '@/components/ui/card'
import { Form } from '@/components/ui/form'
import { toast } from '@/components/ui/toast'
import { type Certificate } from '@/db/queries/certificate'
import { SKILL_LEVELS } from '@/db/queries/skill-level-description'
import appConfig from '~/config/app.json'

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

  return (
    <div className="flex flex-col gap-6">
      <Form {...form}>
        <RequestPanel holder={holder} previous={previous} />
        {certificate.isChangesRequested ? (
          <Banner>
            <p>{t('waitingForVolunteer')}</p>
          </Banner>
        ) : (
          <>
            <SkillsSection certificate={certificate} results={results} />
            <Card className="gap-8 p-5 sm:p-6 xl:grid xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] xl:gap-12">
              <EvaluationSection />
              <CommentSection />
            </Card>
            <DecisionBar
              busy={busy}
              disabled={!canApprove}
              onApprove={() => void preview()}
              onReject={() => setRejecting(true)}
              onRequestChanges={() => void requestChanges()}
            />
          </>
        )}
      </Form>

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
