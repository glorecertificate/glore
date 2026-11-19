'use client'

import { useTranslations } from 'next-intl'

import { FilterSkeleton } from './filter-skeleton'
import { TableSkeleton } from './table-skeleton'

export const InvitationsSkeleton = () => {
  const t = useTranslations('Invitations')

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-6">
        <TableSkeleton
          filters={<FilterSkeleton selects={1} />}
          headers={[t('colEmail'), t('colRole'), t('colStatus')]}
          label={t('title')}
        />
      </div>
    </div>
  )
}
