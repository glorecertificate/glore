'use client'

import { useState } from 'react'

import { useTranslations } from 'next-intl'

import { getOrganizationActivity } from '@/actions/organizations/activity'
import { type ActivityPage } from '@/actions/organizations/activity-core'
import { Banner } from '@/components/ui/banner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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
    <Card>
      <CardHeader>
        <CardTitle>{t('activityTitle')}</CardTitle>
        <CardDescription>{t('activityDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {page.items.length === 0 && <p className="text-sm text-muted-foreground">{t('activityEmpty')}</p>}
        {page.items.length > 0 && <ActivityList items={page.items} label={t('activityTitle')} />}
        {failed && <Banner variant="destructive">{t('activityError')}</Banner>}
        {page.nextCursor && (
          <Button disabled={loading} onClick={loadMore} size="sm" type="button" variant="outline">
            {loading ? t('activityLoading') : t('activityLoadMore')}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
