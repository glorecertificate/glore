'use client'

import { memo, startTransition } from 'react'

import { useTranslations } from 'next-intl'
import { parseAsStringEnum, useQueryState } from 'nuqs'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const ORGANIZATION_TAB_PARAM = 'tab'
const ORGANIZATION_TABS = ['overview', 'members', 'joinRequests', 'settings'] as const
const DEFAULT_ORGANIZATION_TAB = 'overview'

const organizationTabParser = parseAsStringEnum([...ORGANIZATION_TABS]).withDefault(DEFAULT_ORGANIZATION_TAB)

export const useOrganizationTab = () => {
  const [tab, setTab] = useQueryState(ORGANIZATION_TAB_PARAM, {
    ...organizationTabParser,
    history: 'push',
    startTransition,
  })

  return { setTab, tab }
}

export const OrganizationTabs = memo((props: React.ComponentProps<typeof Tabs>) => {
  const { setTab, tab } = useOrganizationTab()

  return (
    <Tabs
      defaultValue={DEFAULT_ORGANIZATION_TAB}
      onValueChange={setTab as (value: string) => void}
      value={tab}
      {...props}
    />
  )
})

export const OrganizationTabsList = memo(
  ({
    isOrgAdmin,
    joinRequestCount,
    ...props
  }: React.ComponentProps<typeof TabsList> & { isOrgAdmin: boolean; joinRequestCount: number }) => {
    const t = useTranslations('Organization')

    return (
      <TabsList className="max-w-full overflow-x-auto" {...props}>
        <TabsTrigger value="overview">{t('overview')}</TabsTrigger>
        <TabsTrigger value="members">{t('members')}</TabsTrigger>
        <TabsTrigger count={joinRequestCount} value="joinRequests">
          {t('joinRequests')}
        </TabsTrigger>
        {isOrgAdmin && <TabsTrigger value="settings">{t('settings')}</TabsTrigger>}
      </TabsList>
    )
  }
)
