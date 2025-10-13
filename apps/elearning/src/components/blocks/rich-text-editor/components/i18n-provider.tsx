import { createContext } from 'react'

import { DEFAULT_LOCALE, type LOCALES } from '../config'
import type messages from '../i18n/en.json'

export interface I18nContext {
  locale: (typeof LOCALES)[number]
  t: typeof messages
}

export const I18nContext = createContext<I18nContext | null>(null)

export interface I18nProviderProps extends React.PropsWithChildren {
  locale?: (typeof LOCALES)[number]
}

export const I18nProvider = async ({ locale = DEFAULT_LOCALE, ...props }: I18nProviderProps) => {
  const t = (
    (await import(`../i18n/${locale}.json`)) as {
      default: typeof messages
    }
  ).default

  return <I18nContext.Provider value={{ locale, t }} {...props} />
}
