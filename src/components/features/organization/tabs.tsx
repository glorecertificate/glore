'use client'

import { useEffect, useOptimistic, useRef, useState, useTransition } from 'react'

import { useTranslations } from 'next-intl'
import { useQueryState } from 'nuqs'

import { Tabs, TabsList } from '@/components/ui/tabs'

import { type InsightsScope } from './insights-cache'
import { OrganizationInviteButton, OrganizationInviteHost } from './invite-host'
import { preloadWithin } from './lazy-tabs'
import {
  DEFAULT_ORGANIZATION_TAB,
  ORGANIZATION_TAB_PARAM,
  type OrganizationTab,
  OrganizationTabContext,
  organizationTabParser,
  useOrganizationTab,
} from './tab-context'
import { OrganizationTabTrigger } from './tab-trigger'

export type { OrganizationTab } from './tab-context'

export const OrganizationTabs = (props: React.ComponentProps<typeof Tabs>) => {
  const [pending, startTransition] = useTransition()
  const [tab, setQueryTab] = useQueryState(ORGANIZATION_TAB_PARAM, {
    ...organizationTabParser,
    history: 'push',
    startTransition,
  })
  const [shown, setShown] = useOptimistic(tab)
  const latest = useRef(0)
  const committed = useRef(tab)
  const [scope, setScope] = useState<InsightsScope | null>(null)

  useEffect(() => {
    committed.current = tab
    latest.current += 1
  }, [tab])

  const setTab = (next: OrganizationTab) => {
    latest.current += 1
    const request = latest.current
    const from = window.location.search
    startTransition(async () => {
      setShown(next)
      if (scope) await preloadWithin(next, scope)
      if (request !== latest.current || next === committed.current || window.location.search !== from) return
      await setQueryTab(next)
    })
  }

  return (
    <OrganizationTabContext value={{ pending, scope, setScope, setTab, shown, tab }}>
      <Tabs
        className="gap-0"
        defaultValue={DEFAULT_ORGANIZATION_TAB}
        onValueChange={value => setTab(value as OrganizationTab)}
        value={shown}
        {...props}
      />
    </OrganizationTabContext>
  )
}

export const OrganizationScope = ({ organizationId, userId }: InsightsScope) => {
  const { setScope } = useOrganizationTab()

  useEffect(() => {
    setScope({ organizationId, userId })
  }, [organizationId, setScope, userId])

  return null
}

export const OrganizationTabsList = ({
  invitationCount,
  isOrgAdmin,
  joinRequestCount,
  ...props
}: React.ComponentProps<typeof TabsList> & {
  invitationCount: number
  isOrgAdmin: boolean
  joinRequestCount: number
}) => {
  const t = useTranslations('Organization')
  const tInvitations = useTranslations('Invitations')
  const { shown: tab } = useOrganizationTab()
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const list = listRef.current
    const active = list?.querySelector<HTMLElement>('[role="tab"][data-state="active"]')
    if (!(list && active)) return
    const listBox = list.getBoundingClientRect()
    const activeBox = active.getBoundingClientRect()
    const start = activeBox.left - listBox.left + list.scrollLeft
    const end = start + activeBox.width
    if (start >= list.scrollLeft && end <= list.scrollLeft + list.clientWidth) return
    list.scrollLeft = start - (list.clientWidth - activeBox.width) / 2
  }, [tab])

  return (
    <OrganizationInviteHost isOrgAdmin={isOrgAdmin}>
      <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-3">
        <TabsList className="max-w-full min-w-0 justify-start overflow-x-auto" ref={listRef} {...props}>
          <OrganizationTabTrigger value="overview">{t('overview')}</OrganizationTabTrigger>
          <OrganizationTabTrigger value="members">{t('members')}</OrganizationTabTrigger>
          <OrganizationTabTrigger count={invitationCount} value="invitations">
            {tInvitations('tab')}
          </OrganizationTabTrigger>
          <OrganizationTabTrigger count={joinRequestCount} value="requests">
            {t('joinRequests')}
          </OrganizationTabTrigger>
          <OrganizationTabTrigger value="certificates">{t('certificates')}</OrganizationTabTrigger>
          <OrganizationTabTrigger value="insights">{t('insights')}</OrganizationTabTrigger>
          <OrganizationTabTrigger value="activity">{t('activity')}</OrganizationTabTrigger>
          {isOrgAdmin && <OrganizationTabTrigger value="settings">{t('settings')}</OrganizationTabTrigger>}
        </TabsList>
        <OrganizationInviteButton />
      </div>
    </OrganizationInviteHost>
  )
}
