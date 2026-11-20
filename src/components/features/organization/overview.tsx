'use client'

import { type OrganizationPanelData } from '@/actions/organizations/queries'

import { AttentionList } from './attention-list'
import { OrganizationChecklist } from './checklist'
import { OverviewActivity } from './overview-activity'
import { OrganizationCertificatesCard, OrganizationMembersCard } from './overview-rail'
import { type OrganizationTab } from './tabs'

const PREVIEW_ACTIVITY_COUNT = 6

export const OrganizationOverview = ({
  data,
  onNavigate,
}: {
  data: OrganizationPanelData
  onNavigate: (tab: OrganizationTab) => void
}) => {
  const { activity, attention, organization, pipeline, stats } = data

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]" data-slot="organization-overview">
      <div className="flex min-w-0 flex-col gap-6">
        <OrganizationChecklist canEditSettings={data.isOrgAdmin} checklist={data.checklist} onNavigate={onNavigate} />
        <AttentionList items={attention} organization={organization.name} />
        <OverviewActivity
          items={activity.items.slice(0, PREVIEW_ACTIVITY_COUNT)}
          onViewAll={() => onNavigate('activity')}
        />
      </div>
      <div className="flex min-w-0 flex-col gap-6">
        <OrganizationCertificatesCard pipeline={pipeline} />
        <OrganizationMembersCard stats={stats} />
      </div>
    </div>
  )
}
