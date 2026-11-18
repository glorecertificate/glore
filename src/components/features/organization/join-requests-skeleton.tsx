'use client'

import { useTranslations } from 'next-intl'

import { Skeleton } from '@/components/ui/skeleton'

import { TabHeader } from './tab-header'

export const JoinRequestsSkeleton = () => {
  const t = useTranslations('Organization')

  return (
    <div className="flex flex-col gap-6">
      <TabHeader description={t('joinRequestsDescription')} title={t('joinRequestsTitle')} />
      <div className="divide-y overflow-hidden rounded-xl border bg-card">
        {Array.from({ length: 3 }, (_, index) => (
          <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between" key={index}>
            <div className="flex min-w-0 gap-3">
              <Skeleton className="size-8 shrink-0 rounded-full" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
