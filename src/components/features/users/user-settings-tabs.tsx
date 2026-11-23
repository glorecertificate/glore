'use client'

import { startTransition } from 'react'

import { useTranslations } from 'next-intl'
import { parseAsStringEnum, useQueryState } from 'nuqs'

import { canHoldCertificates } from '@/components/features/certificates/rules'
import { useSession } from '@/components/providers/session'
import { SectionNav } from '@/components/ui/section-nav'
import { cn } from '@/lib/utils'

const SETTINGS_TAB_PARAM = 'tab'
const SETTINGS_TABS = ['profile', 'account', 'privacy', 'notifications', 'security', 'data'] as const
const DEFAULT_SETTINGS_TAB = 'profile'

const settingsTabParser = parseAsStringEnum([...SETTINGS_TABS]).withDefault(DEFAULT_SETTINGS_TAB)

export const useUserSettingsTab = () => {
  const { user } = useSession()
  const [tab, setTab] = useQueryState(SETTINGS_TAB_PARAM, {
    ...settingsTabParser,
    history: 'push',
    startTransition,
  })
  const privacy = canHoldCertificates(user) || (user.publicProfile && !user.canEdit)
  const tabs = SETTINGS_TABS.filter(id => privacy || id !== 'privacy')
  return { setTab, tab: tabs.includes(tab) ? tab : DEFAULT_SETTINGS_TAB, tabs }
}

export const UserSettingsNav = ({
  className,
  ...props
}: Omit<React.ComponentProps<typeof SectionNav>, 'items' | 'value'>) => {
  const t = useTranslations('Users')
  const { setTab, tab, tabs } = useUserSettingsTab()

  return (
    <SectionNav
      aria-label={t('settingsSections')}
      className={cn('lg:sticky lg:top-6 lg:self-start', className)}
      items={tabs.map(id => ({ id, label: t(id) }))}
      onValueChange={id => setTab(id as (typeof SETTINGS_TABS)[number])}
      value={tab}
      {...props}
    />
  )
}
