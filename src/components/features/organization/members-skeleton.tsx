'use client'

import { useTranslations } from 'next-intl'

import { Skeleton } from '@/components/ui/skeleton'

import { FilterSkeleton } from './filter-skeleton'
import { TabHeader } from './tab-header'
import { TableSkeleton } from './table-skeleton'

export const MembersSkeleton = () => {
  const t = useTranslations('Organization')

  return (
    <div className="flex flex-col gap-6">
      <TabHeader
        actions={<Skeleton className="h-8 w-32" />}
        description={t('membersDescription')}
        title={t('membersTitle')}
      />
      <TableSkeleton
        filters={<FilterSkeleton selects={2} />}
        headers={[t('members'), t('email'), t('role'), t('status'), t('joined')]}
        label={t('membersTitle')}
      />
    </div>
  )
}
