'use client'

import { useTranslations } from 'next-intl'

import { DashboardEmpty } from '@/components/features/dashboard/empty'
import { type ActivityItem } from '@/db/queries/organization-insights'
import { cn } from '@/lib/utils'

import { ActivityList } from './activity-list'
import { OverviewAction, OverviewCard } from './overview-card'

export const OverviewActivity = ({
  className,
  href,
  items,
  onViewAll,
}: {
  className?: string
  href?: string
  items: ActivityItem[]
  onViewAll?: () => void
}) => {
  const t = useTranslations('Organization')
  const tDashboard = useTranslations('Dashboard')

  return (
    <OverviewCard
      action={
        items.length > 0 && (
          <OverviewAction href={href} onClick={onViewAll}>
            {tDashboard('viewAll')}
          </OverviewAction>
        )
      }
      className={cn('flex-1', className)}
      slot="activity-card"
      title={tDashboard('manager.activity')}
    >
      {items.length === 0 && <DashboardEmpty icon="activity" title={t('activityEmpty')} />}
      {items.length > 0 && (
        <ActivityList className="flex-1 justify-between" items={items} label={tDashboard('manager.activity')} />
      )}
    </OverviewCard>
  )
}
