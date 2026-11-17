'use client'

import { createContext, use } from 'react'

import { type AppSettings } from '@/lib/app-settings'

const SettingsContext = createContext<AppSettings | null>(null)

export const SettingsProvider = ({ children, settings }: React.PropsWithChildren<{ settings: AppSettings }>) => (
  <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>
)

export const useSettings = () => {
  const settings = use(SettingsContext)
  if (!settings) throw new Error('useSettings must be used within a SettingsProvider')
  return settings
}
