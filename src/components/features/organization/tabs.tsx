'use client'

import { startTransition } from 'react'

import { useTranslations } from 'next-intl'
import { parseAsStringEnum, useQueryState } from 'nuqs'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const ORGANIZATION_TAB_PARAM = 'tab'
const ORGANIZATION_TABS = [
  'overview',
  'members',
  'invitations',
  'requests',
  'certificates',
  'insights',
  'activity',
  'settings',
] as const

export type OrganizationTab = (typeof ORGANIZATION_TABS)[number]
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

export const OrganizationTabs = (props: React.ComponentProps<typeof Tabs>) => {
  const { setTab, tab } = useOrganizationTab()

  return (
    <Tabs
      defaultValue={DEFAULT_ORGANIZATION_TAB}
      onValueChange={setTab as (value: string) => void}
      value={tab}
      {...props}
    />
  )
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

  return (
    <TabsList className="max-w-full overflow-x-auto" {...props}>
      <TabsTrigger value="overview">{t('overview')}</TabsTrigger>
      <TabsTrigger value="members">{t('members')}</TabsTrigger>
      <TabsTrigger count={invitationCount} value="invitations">
        {tInvitations('tab')}
      </TabsTrigger>
      <TabsTrigger count={joinRequestCount} value="requests">
        {t('joinRequests')}
      </TabsTrigger>
      <TabsTrigger value="certificates">{t('certificates')}</TabsTrigger>
      <TabsTrigger value="insights">{t('insights')}</TabsTrigger>
      <TabsTrigger value="activity">{t('activity')}</TabsTrigger>
      {isOrgAdmin && <TabsTrigger value="settings">{t('settings')}</TabsTrigger>}
    </TabsList>
  )
}
