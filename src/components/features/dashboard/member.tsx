'use client'

import { type Route } from 'next'

import { useTranslations } from 'next-intl'

import { type MemberSummary } from '@/actions/dashboard/core'
import { CertificatePreview } from '@/components/features/certificates/certificate-preview'
import { CertificateStatusBadge } from '@/components/features/certificates/certificate-status-badge'
import { EligibilityPanel } from '@/components/features/certificates/eligibility-panel'
import { StepList } from '@/components/features/certificates/step-list'
import { courseIconVariants } from '@/components/features/courses/course-list/type-select'
import { DashboardChecklist } from '@/components/features/dashboard/checklist'
import { DashboardHero } from '@/components/features/dashboard/hero'
import { DashboardSection, StatLink } from '@/components/features/dashboard/section'
import { NotificationList } from '@/components/features/notifications/notification-list'
import { LucideIcon } from '@/components/icons/lucide'
import { Banner } from '@/components/ui/banner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from '@/components/ui/link'
import { Progress } from '@/components/ui/progress'
import { type EnumType } from '@/db/types'
import { type IconName } from '@/lib/types'
import { cn } from '@/lib/utils'

const CourseIcon = ({ icon, type }: { icon: string | null; type: EnumType<'course_type'> }) => (
  <span
    aria-hidden
    className={cn(
      'flex size-9 shrink-0 items-center justify-center rounded-lg',
      courseIconVariants({ background: true, type })
    )}
  >
    {icon ? (
      <LucideIcon className="size-4" name={icon as IconName} />
    ) : (
      <LucideIcon name="book-open" className="size-4" />
    )}
  </span>
)

export const MemberDashboard = ({
  firstName,
  member,
  organization,
  view,
}: {
  firstName: string
  member: MemberSummary
  organization: string | null
  view: 'learner' | 'volunteer'
}) => {
  const t = useTranslations('Dashboard')
  const tDetail = useTranslations('Certificates.detail')
  const { certificate, checklist, courses, eligibility, journey, notifications } = member
  const isVolunteer = view === 'volunteer'
  const hasOpenRequest = certificate?.isOpen ?? false
  const canRequest = Boolean(eligibility?.eligible) && !hasOpenRequest && !certificate?.isApproved
  const blocked =
    isVolunteer &&
    eligibility &&
    !eligibility.eligible &&
    (!certificate || certificate.isDraft || certificate.isWithdrawn)
      ? eligibility
      : null

  const heroAction = (() => {
    if (canRequest) return { href: '/certificates/new' as Route, label: t('requestCertificate') }
    const [next] = courses.continuing
    if (next) {
      return { href: `/courses/${next.slug}` as Route, label: t('resumeLearning') }
    }
    return { href: '/courses' as Route, label: t('browseCourses') }
  })()

  const entries = checklist.map(item => ({
    action: t(`checklist.${view}.${item.key}.action` as Parameters<typeof t>[0]),
    description: t(`checklist.${view}.${item.key}.description` as Parameters<typeof t>[0]),
    done: item.done,
    href: item.href,
    key: item.key,
    title: t(`checklist.${view}.${item.key}.title` as Parameters<typeof t>[0]),
  }))

  return (
    <div className="flex flex-col gap-8 pt-6 pb-10">
      <DashboardHero
        action={heroAction}
        name={firstName}
        organization={organization}
        subtitle={t(`subtitle.${view}`)}
      />

      <DashboardChecklist
        entries={entries}
        progress={t('checklist.progress', {
          completed: entries.filter(({ done }) => done).length,
          total: entries.length,
        })}
        title={t('checklist.title')}
      />

      {isVolunteer && journey && (
        <DashboardSection
          action={
            certificate ? { href: `/certificates/${certificate.id}` as Route, label: t('viewRequest') } : undefined
          }
          title={t('journey.title')}
        >
          <Card>
            <CardContent className="flex flex-col gap-6">
              <StepList
                aria-label={t('journey.title')}
                items={journey.map(({ key, outcome, state }) => ({
                  description: outcome ? undefined : t(`journey.${key}Description`),
                  key,
                  label: outcome ? tDetail(`outcomes.${outcome}`) : t(`journey.${key}`),
                  state,
                }))}
              />
              {certificate?.isApproved && (
                <div className="flex flex-wrap items-center gap-4">
                  <CertificatePreview certificate={certificate} className="w-32 shrink-0" />
                  <div className="flex flex-col items-start gap-2">
                    <CertificateStatusBadge status={certificate.status} />
                    <p className="text-sm text-muted-foreground">{t('certificate.issued')}</p>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/certificates/${certificate.id}`}>{t('certificate.view')}</Link>
                    </Button>
                  </div>
                </div>
              )}
              {certificate && !certificate.isApproved && certificate.isOpen && (
                <div className="flex flex-wrap items-center gap-3">
                  <CertificateStatusBadge status={certificate.status} />
                  <p className="text-sm text-muted-foreground">
                    {certificate.isChangesRequested ? t('certificate.changes') : t('certificate.waiting')}
                  </p>
                </div>
              )}
              {certificate?.isDraft && (
                <div className="flex flex-wrap items-center gap-3">
                  <CertificateStatusBadge status={certificate.status} />
                  <Button asChild size="sm" variant="brand">
                    <Link href={`/certificates/new?draft=${certificate.id}` as Route}>
                      {t('certificate.continueDraft')}
                    </Link>
                  </Button>
                </div>
              )}
              {canRequest && !certificate?.isDraft && (
                <Banner className="flex-wrap items-center justify-between" variant="info">
                  <div className="space-y-1">
                    <p className="font-semibold text-brand-text">{t('certificate.readyTitle')}</p>
                    <p className="text-sm text-muted-foreground">{t('certificate.readyMessage')}</p>
                  </div>
                  <Button asChild icon="plus" size="sm" variant="brand">
                    <Link href="/certificates/new">{t('requestCertificate')}</Link>
                  </Button>
                </Banner>
              )}
            </CardContent>
          </Card>
        </DashboardSection>
      )}

      {blocked && (
        <EligibilityPanel
          className="mx-0 max-w-none"
          eligibility={{ ...blocked, completedSkillCourseIds: [], selfLevels: {} }}
        />
      )}

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatLink href="/courses" label={t('stats.enrolled')} value={courses.enrolled} />
        <StatLink href="/courses" label={t('stats.inProgress')} value={courses.inProgress} />
        <StatLink href="/courses" label={t('stats.completed')} value={courses.completed} />
        {isVolunteer && eligibility ? (
          <StatLink
            description={t('stats.skillsRequired', { count: eligibility.minSkills })}
            href="/certificates"
            label={t('stats.skills')}
            value={eligibility.completedSkillCount}
          />
        ) : (
          <StatLink href="/courses" label={t('stats.available')} value={courses.available} />
        )}
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <DashboardSection action={{ href: '/courses', label: t('viewCourses') }} title={t('continue.title')}>
          {courses.continuing.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('continue.emptyTitle')}</CardTitle>
                <CardDescription>{t('continue.emptyDescription')}</CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <ul className="flex flex-col gap-3">
              {courses.continuing.map(course => (
                <li key={course.slug}>
                  <Link
                    className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-accent/40"
                    href={`/courses/${course.slug}` as Route}
                  >
                    <CourseIcon icon={course.icon} type={course.type} />
                    <span className="flex min-w-0 flex-1 flex-col gap-2">
                      <span className="truncate text-sm font-medium">{course.title}</span>
                      <span className="flex items-center gap-2">
                        <Progress aria-label={course.title} className="h-1.5" color="brand" value={course.percent} />
                        <span className="w-10 shrink-0 text-right text-xs font-medium tabular-nums">
                          {t('continue.percent', { percent: course.percent })}
                        </span>
                      </span>
                    </span>
                    <LucideIcon name="arrow-right" className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </DashboardSection>

        <DashboardSection title={t('recommended.title')}>
          {courses.recommendations.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('recommended.emptyTitle')}</CardTitle>
                <CardDescription>{t('recommended.emptyDescription')}</CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <ul className="flex flex-col gap-3">
              {courses.recommendations.map(course => (
                <li key={course.slug}>
                  <Link
                    className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-accent/40"
                    href={`/courses/${course.slug}` as Route}
                  >
                    <CourseIcon icon={course.icon} type={course.type} />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium">{course.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {course.goal ? t('recommended.goal') : t(`recommended.type.${course.type}`)}
                      </span>
                    </span>
                    <LucideIcon name="arrow-right" className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </DashboardSection>
      </div>

      <DashboardSection action={{ href: '/notifications', label: t('viewAll') }} title={t('updates.title')}>
        <Card>
          <CardContent>
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('updates.empty')}</p>
            ) : (
              <NotificationList notifications={notifications} />
            )}
          </CardContent>
        </Card>
      </DashboardSection>
    </div>
  )
}
