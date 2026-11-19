'use client'

import { startTransition } from 'react'

import { useTranslations } from 'next-intl'
import { parseAsStringEnum, useQueryState } from 'nuqs'

import { cn } from '@/lib/utils'

const SETTINGS_TAB_PARAM = 'tab'
const SETTINGS_TABS = ['profile', 'account', 'privacy', 'notifications', 'security', 'data'] as const
const DEFAULT_SETTINGS_TAB = 'profile'

const settingsTabParser = parseAsStringEnum([...SETTINGS_TABS]).withDefault(DEFAULT_SETTINGS_TAB)

export const useUserSettingsTab = () => {
  const [tab, setTab] = useQueryState(SETTINGS_TAB_PARAM, {
    ...settingsTabParser,
    history: 'push',
    startTransition,
  })
  return { setTab, tab }
}

export const UserSettingsNav = ({ className, ...props }: React.ComponentProps<'nav'>) => {
  const t = useTranslations('Users')
  const { setTab, tab } = useUserSettingsTab()

  return (
    <nav
      aria-label={t('settingsSections')}
      className={cn(
        '-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 lg:sticky lg:top-6 lg:mx-0 lg:flex-col lg:self-start lg:overflow-visible lg:px-0',
        className
      )}
      {...props}
    >
      {SETTINGS_TABS.map(item => (
        <button
          aria-current={item === tab ? 'page' : undefined}
          className={cn(
            'inline-flex min-h-11 shrink-0 items-center rounded-lg px-3 text-left text-sm whitespace-nowrap text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:focus-ring lg:min-h-9',
            item === tab && 'bg-muted font-medium text-foreground'
          )}
          key={item}
          onClick={() => setTab(item)}
          type="button"
        >
          {t(item)}
        </button>
      ))}
    </nav>
  )
}
