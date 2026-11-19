'use client'

import { type Route } from 'next'

import { useTranslations } from 'next-intl'

import { type ManagerSummary } from '@/actions/dashboard/core'
import { DashboardChecklist } from '@/components/features/dashboard/checklist'
import { DashboardHero } from '@/components/features/dashboard/hero'
import { AttentionList } from '@/components/features/organization/attention-list'
import { OverviewActivity } from '@/components/features/organization/overview-activity'
import { OrganizationCertificatesCard, OrganizationMembersCard } from '@/components/features/organization/overview-rail'

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
  const { activity, attention, checklist, isOwner, pipeline, stats } = manager

  const entries = CHECKLIST_STEPS.map(({ key, tab }) => ({
    action: tOrganization(`checklist_${key}_action`),
    description: tOrganization(`checklist_${key}_description`),
    done: checklist[key],
    href: key === 'profile' && !isOwner ? undefined : (`/organization?tab=${tab}` as Route),
    key,
    title: tOrganization(`checklist_${key}`),
  }))

  return (
    <div className="flex flex-col gap-6">
      <DashboardHero
        organization={organization}
        subtitle={t('subtitle.manager')}
        title={t('greeting', { name: firstName })}
      />

      <DashboardChecklist
        entries={entries}
        progress={tOrganization('checklistProgress', { completed: checklist.completed, total: checklist.total })}
        title={tOrganization('checklistTitle')}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <AttentionList items={attention} organization={organization ?? ''} />
          <OverviewActivity href="/organization?tab=activity" items={activity} />
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <OrganizationCertificatesCard pipeline={pipeline} />
          <OrganizationMembersCard
            stats={{
              adminCount: stats.admins,
              learnerCount: stats.learners,
              memberCount: stats.members,
              representativeCount: stats.representatives,
              tutorCount: stats.tutors,
              volunteerCount: stats.volunteers,
            }}
          />
        </div>
      </div>
    </div>
  )
}
