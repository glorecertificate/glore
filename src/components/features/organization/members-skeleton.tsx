'use client'

import { useTranslations } from 'next-intl'

import { FilterSkeleton } from './filter-skeleton'
import { TableSkeleton } from './table-skeleton'

export const MembersSkeleton = () => {
  const t = useTranslations('Organization')

  return (
    <div className="flex flex-col gap-6">
      <TableSkeleton
        filters={<FilterSkeleton selects={2} />}
        headers={[t('members'), t('email'), t('role'), t('status'), t('joined')]}
        label={t('membersTitle')}
      />
    </div>
  )
}
