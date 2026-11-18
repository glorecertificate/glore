'use client'

import { useTranslations } from 'next-intl'

import { Skeleton } from '@/components/ui/skeleton'

import { FilterSkeleton } from './filter-skeleton'
import { TabHeader } from './tab-header'
import { TableSkeleton } from './table-skeleton'

export const InvitationsSkeleton = () => {
  const t = useTranslations('Invitations')

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-6">
        <TabHeader actions={<Skeleton className="h-8 w-32" />} description={t('description')} title={t('title')} />
        <TableSkeleton
          filters={<FilterSkeleton selects={1} />}
          headers={[t('colEmail'), t('colRole'), t('colStatus')]}
          label={t('title')}
        />
      </div>
    </div>
  )
}
