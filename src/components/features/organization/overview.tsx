'use client'

import { useTranslations } from 'next-intl'

import { type OrganizationPanelData } from '@/actions/organizations/queries'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { ActivityList } from './activity-list'
import { AttentionList } from './attention-list'
import { OrganizationChecklist } from './checklist'
import { OrganizationCertificatesCard, OrganizationMembersCard } from './overview-rail'
import { type OrganizationTab } from './tabs'

const PREVIEW_ACTIVITY_COUNT = 5

export const OrganizationOverview = ({
  data,
  onNavigate,
}: {
  data: OrganizationPanelData
  onNavigate: (tab: OrganizationTab) => void
}) => {
  const t = useTranslations('Organization')
  const { activity, attention, organization, pipeline, stats } = data

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]" data-slot="organization-overview">
      <div className="flex min-w-0 flex-col gap-6">
        <OrganizationChecklist canEditSettings={data.isOrgAdmin} checklist={data.checklist} onNavigate={onNavigate} />
        <AttentionList items={attention} organization={organization.name} />
        <Card>
          <CardHeader>
            <CardTitle>{t('activityTitle')}</CardTitle>
            {activity.items.length > 0 && (
              <CardAction>
                <Button onClick={() => onNavigate('activity')} size="sm" type="button" variant="ghost">
                  {t('activityViewAll')}
                </Button>
              </CardAction>
            )}
          </CardHeader>
          <CardContent>
            {activity.items.length === 0 && <p className="text-sm text-muted-foreground">{t('activityEmpty')}</p>}
            {activity.items.length > 0 && (
              <ActivityList items={activity.items.slice(0, PREVIEW_ACTIVITY_COUNT)} label={t('activityTitle')} />
            )}
          </CardContent>
        </Card>
      </div>
      <div className="flex min-w-0 flex-col gap-6">
        <OrganizationMembersCard stats={stats} />
        <OrganizationCertificatesCard pipeline={pipeline} />
      </div>
    </div>
  )
}
