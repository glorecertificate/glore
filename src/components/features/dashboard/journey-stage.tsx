import { type Route } from 'next'

import { useFormatter, useTranslations } from 'next-intl'

import { type VolunteerSummary, type nextSkillCourse } from '@/actions/dashboard/core'
import { CertificatePreview } from '@/components/features/certificates/certificate-preview'
import { CertificateStatusBadge } from '@/components/features/certificates/certificate-status-badge'
import { CertificatePreviewDialog } from '@/components/features/dashboard/certificate-preview-dialog'
import { WIZARD_STEP_LABELS } from '@/components/features/dashboard/journey-steps'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Link } from '@/components/ui/link'
import { ShareButton } from '@/components/ui/share-button'
import { timestampMillis } from '@/db/queries/organization'
import { VERIFY_ROOT } from '@/lib/constants'
import { cn } from '@/lib/utils'

const CodeBlock = ({ code, href }: { code: string; href?: Route }) => {
  const t = useTranslations('Dashboard.journey')

  return (
    <div className="flex flex-col gap-1">
      <span className="type-label text-fg-2">{t('code.label')}</span>
      {href ? (
        <Link
          className="w-fit rounded-sm font-mono text-lg tracking-wide text-action-text underline-offset-4 hover:underline focus-visible:focus-ring"
          href={href}
        >
          {code}
        </Link>
      ) : (
        <span className="font-mono text-lg tracking-wide text-fg-1">{code}</span>
      )}
      <span className="type-caption text-fg-2">{t(href ? 'code.verify' : 'code.pending')}</span>
    </div>
  )
}

export const JourneyStage = ({
  className,
  next,
  volunteer,
}: {
  className?: string
  next: ReturnType<typeof nextSkillCourse>
  volunteer: VolunteerSummary
}) => {
  const t = useTranslations('Dashboard.journey')
  const tWizard = useTranslations('CertificateWizard')
  const { dateTime, list } = useFormatter()
  const { certificate, eligibility, journey, review } = volunteer
  const { phase, steps } = journey

  const date = (value: string | null | undefined) =>
    value ? dateTime(new Date(timestampMillis(value)), { dateStyle: 'long' }) : ''
  const stepLabel = (key: keyof typeof WIZARD_STEP_LABELS) => tWizard(WIZARD_STEP_LABELS[key])
  const current = steps.find(({ state }) => state === 'current')
  const flagged = steps.flatMap(({ key, state }) => (state === 'flagged' ? [stepLabel(key)] : []))
  const requestHref = `/certificates/${certificate?.id}` as Route
  const draftHref = `/certificates/new?draft=${certificate?.id}` as Route
  const reason = phase === 'rejected' ? certificate?.rejectedReason : certificate?.revokedReason

  const lead = () => {
    if (phase === 'learn') return t('phases.learn.lead', { min: eligibility.minSkills })
    if (phase === 'draft') return t('phases.draft.lead', { step: stepLabel(current?.key ?? 'experience') })
    if (phase === 'changes' || phase === 'review') {
      return review?.tutor ? t(`phases.${phase}.leadTutor`, { name: review.tutor }) : t(`phases.${phase}.lead`)
    }
    if (phase === 'issued') {
      return t('phases.issued.lead', { date: date(certificate?.issuedAt ?? certificate?.reviewedAt) })
    }
    return t(`phases.${phase}.lead`)
  }

  const primary = () => {
    if (phase === 'learn' && next) {
      return {
        href: `/courses/${next.slug}` as Route,
        label: t('actions.continueCourse', { course: next.title }),
      }
    }
    if (phase === 'learn') return { href: '/courses' as Route, label: t('actions.browseCourses') }
    if (phase === 'ready') return { href: '/certificates/new' as Route, label: t('actions.start') }
    if (phase === 'draft') return { href: draftHref, label: t('actions.continueDraft') }
    if (phase === 'changes') return { href: draftHref, label: t('actions.resubmit') }
    if ((phase === 'rejected' || phase === 'withdrawn') && eligibility.eligible) {
      return { href: '/certificates/new' as Route, label: t('actions.newRequest') }
    }
    return null
  }

  const action = primary()
  const showRequest = phase === 'changes' || phase === 'review' || phase === 'rejected' || phase === 'withdrawn'
  const hasActions = Boolean(action) || (Boolean(certificate) && phase !== 'learn' && phase !== 'ready')
  const stageKey = journey.stages[journey.current]?.key ?? 'learn'

  return (
    <Card className={cn('min-w-0 gap-5 p-6 sm:p-9', className)} data-phase={phase} data-slot="journey-stage">
      <div className="flex min-h-5 items-center justify-between gap-4">
        <span className="type-overline text-fg-2">{t(`stages.${stageKey}`)}</span>
        {certificate && <CertificateStatusBadge className="shrink-0" status={certificate.status} />}
      </div>
      <div className="flex min-w-0 flex-col gap-2.5">
        <h2 className="type-display text-balance text-fg-title" id="journey-stage-title">
          {t(`phases.${phase}.title`)}
        </h2>
        <p className="max-w-prose text-base text-fg-2">{lead()}</p>
      </div>
      {phase === 'changes' && (review?.comment || flagged.length > 0) && (
        <div className="flex flex-col gap-4">
          {review?.comment && (
            <figure className="flex flex-col gap-2 rounded-lg bg-warning-subtle p-4">
              <figcaption className="type-label text-warning-text">
                {review.tutor ? t('note.from', { name: review.tutor }) : t('note.tutor')}
              </figcaption>
              <blockquote className="text-sm whitespace-pre-line text-fg-1">{review.comment}</blockquote>
            </figure>
          )}
          {flagged.length > 0 && (
            <p className="text-sm text-fg-2">{t('note.steps', { steps: list(flagged, { type: 'conjunction' }) })}</p>
          )}
        </div>
      )}
      {phase === 'review' && certificate?.code && (
        <div className="flex flex-col gap-3">
          <CodeBlock code={certificate.code} />
          {certificate.submittedAt && (
            <p className="text-sm text-fg-2">{t('sent', { date: date(certificate.submittedAt) })}</p>
          )}
        </div>
      )}
      {phase === 'issued' && certificate?.code && (
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <CertificatePreview certificate={certificate} className="w-40 shrink-0" />
          <CodeBlock code={certificate.code} href={`${VERIFY_ROOT}/${certificate.code}` as Route} />
        </div>
      )}
      {(phase === 'rejected' || phase === 'revoked') && reason && (
        <div className="flex flex-col gap-1">
          <span className="type-label text-fg-2">{t('reason.label')}</span>
          <p className="text-sm whitespace-pre-line text-fg-1">{reason}</p>
        </div>
      )}
      {hasActions && (
        <div className="flex flex-wrap items-center gap-3 max-sm:*:w-full">
          {action && (
            <Button asChild className="max-w-full" size="lg" variant="brand">
              <Link href={action.href}>
                <span className="truncate">{action.label}</span>
              </Link>
            </Button>
          )}
          {phase === 'issued' && certificate && (
            <>
              <Button asChild icon="download" size="lg" variant="brand">
                <a
                  href={certificate.documentUrl ?? `/api/v1/certificates/${certificate.id}/pdf`}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {t('actions.download')}
                </a>
              </Button>
              <ShareButton
                copiedLabel={t('actions.copied')}
                failedLabel={t('actions.copyFailed')}
                icon="share-2"
                size="lg"
                title={t('actions.shareTitle')}
                url={`${VERIFY_ROOT}/${certificate.code}`}
                variant="outline"
              >
                {t('actions.share')}
              </ShareButton>
            </>
          )}
          {(phase === 'draft' || phase === 'changes') && certificate && (
            <CertificatePreviewDialog certificate={certificate} />
          )}
          {showRequest && certificate && (
            <Button asChild size="lg" variant="outline">
              <Link href={requestHref}>{t('actions.viewRequest')}</Link>
            </Button>
          )}
          {phase === 'revoked' && certificate && (
            <Button asChild size="lg" variant="outline">
              <Link href={requestHref}>{t('actions.viewCertificate')}</Link>
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}
