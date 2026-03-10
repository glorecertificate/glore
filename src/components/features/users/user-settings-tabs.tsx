'use client'

import { memo, startTransition } from 'react'

import { useTranslations } from 'next-intl'
import { parseAsStringEnum, useQueryState } from 'nuqs'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const SETTINGS_TAB_PARAM = 'tab'
const SETTINGS_TABS = ['profile', 'account'] as const
const DEFAULT_SETTINGS_TAB = 'profile'

export type UserSettingsTab = (typeof SETTINGS_TABS)[number]

const settingsTabParser = parseAsStringEnum([...SETTINGS_TABS]).withDefault(DEFAULT_SETTINGS_TAB)

export const useUserSettingsTab = () => {
  const [tab, setTab] = useQueryState(SETTINGS_TAB_PARAM, {
    ...settingsTabParser,
    history: 'push',
    startTransition,
  })
  return { setTab, tab }
}

export const UserSettingsTabs = memo((props: React.ComponentProps<typeof Tabs>) => {
  const { tab, setTab } = useUserSettingsTab()

  return (
    <Tabs defaultValue={DEFAULT_SETTINGS_TAB} onValueChange={setTab as (tab: string) => void} value={tab} {...props} />
  )
})

export const UserSettingsTabsList = memo(({ children, ...props }: React.ComponentProps<typeof TabsList>) => {
  const t = useTranslations('Users')

  return (
    <TabsList {...props}>
      {SETTINGS_TABS.map(tab => (
        <TabsTrigger key={tab} value={tab}>
          {t(tab)}
        </TabsTrigger>
      ))}
    </TabsList>
  )
})
