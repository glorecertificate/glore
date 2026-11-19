import { type Route } from 'next'

import { useFormatter, useTranslations } from 'next-intl'

import { type VolunteerSummary, nextSkillCourse } from '@/actions/dashboard/core'
import { type WizardStep } from '@/components/features/certificates/rules'
import { CertificatePreviewDialog } from '@/components/features/dashboard/certificate-preview-dialog'
import { DashboardHero } from '@/components/features/dashboard/hero'
import { VolunteerSteps } from '@/components/features/dashboard/volunteer-steps'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { ShareButton } from '@/components/ui/share-button'
import { timestampMillis } from '@/db/queries/organization'
import { VERIFY_ROOT } from '@/lib/constants'

const WIZARD_STEP_LABELS = {
  experience: 'stepsExperience',
  organization: 'stepsOrganization',
  review: 'stepsReview',
  skills: 'stepsSkills',
} as const satisfies Record<WizardStep, string>

export const VolunteerHero = ({
  firstName,
  next,
  volunteer,
}: {
  firstName: string
  next: ReturnType<typeof nextSkillCourse>
  volunteer: VolunteerSummary
}) => {
  const t = useTranslations('Dashboard.journey')
  const tDashboard = useTranslations('Dashboard')
  const tVolunteer = useTranslations('Dashboard.volunteer')
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
        label: t(next.started ? 'actions.continueCourse' : 'actions.startCourse', { course: next.title }),
      }
    }
    if (phase === 'learn') return { href: '/courses' as Route, label: t('actions.browseCourses') }
    if (phase === 'ready') return { href: '/certificates/new' as Route, label: t('actions.start') }
    if (phase === 'draft') return { href: draftHref, label: t('actions.continueDraft') }
    if (phase === 'changes') return { href: draftHref, label: t('actions.resubmit') }
    if ((phase === 'rejected' || phase === 'withdrawn') && eligibility.eligible) {
      return { href: '/certificates/new' as Route, label: t('actions.newRequest') }
    }
    if (certificate && (phase === 'issued' || phase === 'revoked')) {
      return { href: requestHref, label: t('actions.viewCertificate') }
    }
    if (certificate) return { href: requestHref, label: t('actions.viewRequest') }
    return null
  }

  const action = primary()

  return (
    <DashboardHero
      action={action ?? undefined}
      actions={
        <>
          {(phase === 'draft' || phase === 'changes') && certificate && (
            <CertificatePreviewDialog certificate={certificate} />
          )}
          {phase === 'issued' && certificate && (
            <>
              <Button asChild icon="download" variant="outline">
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
                title={t('actions.shareTitle')}
                url={`${VERIFY_ROOT}/${certificate.code}`}
                variant="outline"
              >
                {t('actions.share')}
              </ShareButton>
            </>
          )}
          {(phase === 'withdrawn' || phase === 'rejected') && certificate && eligibility.eligible && (
            <Button asChild variant="outline">
              <Link href={requestHref}>{t('actions.viewRequest')}</Link>
            </Button>
          )}
        </>
      }
      eyebrow={tVolunteer('eyebrow', { current: journey.current + 1, total: journey.stages.length })}
      subtitle={
        <div className="flex flex-col gap-3">
          <p>{lead()}</p>
          {phase === 'changes' && review?.comment && (
            <figure className="flex flex-col gap-1 rounded-lg bg-warning-subtle p-3">
              <figcaption className="type-label text-warning-text">
                {review.tutor ? t('note.from', { name: review.tutor }) : t('note.tutor')}
              </figcaption>
              <blockquote className="text-sm whitespace-pre-line text-fg-1">{review.comment}</blockquote>
              {flagged.length > 0 && (
                <p className="text-sm text-fg-2">
                  {t('note.steps', { steps: list(flagged, { type: 'conjunction' }) })}
                </p>
              )}
            </figure>
          )}
        </div>
      }
      title={tDashboard('greeting', { name: firstName })}
    >
      <VolunteerSteps volunteer={volunteer} />
    </DashboardHero>
  )
}
