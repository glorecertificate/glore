'use client'

import { type Route } from 'next'

import { FileClockIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { type ManagerSummary } from '@/actions/dashboard/core'
import { AgeBadge } from '@/components/features/certificates/age-badge'
import { DashboardChecklist } from '@/components/features/dashboard/checklist'
import { DashboardHero } from '@/components/features/dashboard/hero'
import { StatLink } from '@/components/features/dashboard/section'
import { ActivityList } from '@/components/features/organization/activity-list'
import { OrganizationPipeline } from '@/components/features/organization/pipeline'
import { AvatarStack } from '@/components/ui/avatar-stack'
import { Banner } from '@/components/ui/banner'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from '@/components/ui/link'

const CHECKLIST_STEPS = [
  { key: 'profile', tab: 'settings' },
  { key: 'tutor', tab: 'invitations' },
  { key: 'volunteers', tab: 'invitations' },
  { key: 'certificate', tab: 'certificates' },
] as const

export const ManagerDashboard = ({
  firstName,
  manager,
  organization,
}: {
  firstName: string
  manager: ManagerSummary
  organization: string | null
}) => {
  const t = useTranslations('Dashboard')
  const tOrganization = useTranslations('Organization')
  const { activeLinks, activity, checklist, isOwner, members, pipeline, stats, waiting } = manager
  const inReview = pipeline.submitted + pipeline.in_review + pipeline.changes_requested

  const entries = CHECKLIST_STEPS.map(({ key, tab }) => ({
    action: tOrganization(`checklist_${key}_action`),
    description: tOrganization(`checklist_${key}_description`),
    done: checklist[key],
    href: key === 'profile' && !isOwner ? undefined : (`/organization?tab=${tab}` as Route),
    key,
    title: tOrganization(`checklist_${key}`),
  }))

  return (
    <div className="flex flex-col gap-8 pt-6 pb-10">
      <DashboardHero
        action={{ href: '/organization', label: t('manager.openOrganization') }}
        name={firstName}
        organization={organization}
        subtitle={t('subtitle.manager')}
      />

      {waiting.count > 0 && waiting.oldest && (
        <Banner className="flex-wrap items-center justify-between" variant="warning">
          <div className="flex items-start gap-3">
            <FileClockIcon className="mt-0.5 size-4 shrink-0" />
            <div className="space-y-1">
              <p className="font-semibold">{t('manager.waitingTitle', { count: waiting.count })}</p>
              <p className="text-sm text-muted-foreground">{t('manager.waitingDescription')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AgeBadge days={waiting.oldest.days} tone={waiting.oldest.tone} />
            <Button asChild size="sm" variant="brand">
              <Link href="/organization?tab=certificates">{t('manager.assign')}</Link>
            </Button>
          </div>
        </Banner>
      )}

      <DashboardChecklist
        entries={entries}
        progress={tOrganization('checklistProgress', { completed: checklist.completed, total: checklist.total })}
        title={tOrganization('checklistTitle')}
      />

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <StatLink href="/organization?tab=members" label={t('manager.members')} value={stats.members}>
          <AvatarStack avatars={members} />
        </StatLink>
        <StatLink
          description={t('manager.invitationsDescription', { links: activeLinks })}
          href="/organization?tab=invitations"
          label={t('manager.invitations')}
          value={manager.pendingInvitations}
        />
        <StatLink
          description={t('manager.requestsDescription')}
          href="/organization?tab=requests"
          label={t('manager.requests')}
          value={manager.pendingJoinRequests}
        />
        <StatLink
          description={t('manager.inReviewDescription')}
          href="/organization?tab=certificates"
          label={t('manager.inReview')}
          value={inReview}
        />
        <StatLink
          description={t('manager.issuedDescription')}
          href="/organization?tab=certificates"
          label={t('manager.issued')}
          value={pipeline.approved}
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <OrganizationPipeline pipeline={pipeline} />

        <Card>
          <CardHeader>
            <CardTitle>{t('manager.activity')}</CardTitle>
            <CardAction>
              <Link className="text-sm font-medium" href="/organization?tab=activity" variant="primary">
                {t('viewAll')}
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">{tOrganization('activityEmpty')}</p>
            ) : (
              <ActivityList items={activity} label={t('manager.activity')} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
