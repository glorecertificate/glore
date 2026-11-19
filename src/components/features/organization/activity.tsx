'use client'

import { useState } from 'react'

import { useTranslations } from 'next-intl'

import { getOrganizationActivity } from '@/actions/organizations/activity'
import { type ActivityPage } from '@/actions/organizations/activity-core'
import { LucideIcon } from '@/components/icons/lucide'
import { Banner } from '@/components/ui/banner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'

import { ActivityList } from './activity-list'

export const OrganizationActivity = ({
  initial,
  organizationId,
}: {
  initial: ActivityPage
  organizationId?: number
}) => {
  const t = useTranslations('Organization')
  const [page, setPage] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)

  const loadMore = async () => {
    if (!page.nextCursor) return
    setLoading(true)
    setFailed(false)
    const { data } = await getOrganizationActivity(page.nextCursor, organizationId)
    setLoading(false)
    if (!data) {
      setFailed(true)
      return
    }
    setPage(current => ({ items: [...current.items, ...data.items], nextCursor: data.nextCursor }))
  }

  return (
    <div className="flex flex-col gap-6">
      {page.items.length === 0 && (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <LucideIcon name="history" />
            </EmptyMedia>
            <EmptyTitle>{t('activityEmptyTitle')}</EmptyTitle>
            <EmptyDescription>{t('activityEmpty')}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
      {page.items.length > 0 && (
        <Card>
          <CardContent className="flex flex-col gap-4">
            <ActivityList items={page.items} label={t('activityTitle')} />
            {failed && (
              <Banner className="items-center justify-between" role="alert" variant="destructive">
                {t('activityError')}
                <Button onClick={loadMore} size="sm" type="button" variant="outline">
                  {t('retry')}
                </Button>
              </Banner>
            )}
            {page.nextCursor && !failed && (
              <Button
                className="self-start"
                loading={loading}
                loadingText={t('activityLoading')}
                onClick={loadMore}
                size="sm"
                type="button"
                variant="outline"
              >
                {t('activityLoadMore')}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
