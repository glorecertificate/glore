'use client'

import { createContext, use } from 'react'

import { type AppSettings, DEFAULT_SETTINGS } from '@/lib/app-settings'

const SettingsContext = createContext<AppSettings>(DEFAULT_SETTINGS)

export const SettingsProvider = ({ children, settings }: React.PropsWithChildren<{ settings: AppSettings }>) => (
  <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>
)

export const useSettings = () => use(SettingsContext)
