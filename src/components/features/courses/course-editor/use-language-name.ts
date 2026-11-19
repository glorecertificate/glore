import { type Locale, useLocale, useTranslations } from 'next-intl'

export const useLanguageName = (language: Locale) => {
  const locale = useLocale()
  const tLang = useTranslations('Intl.Languages')
  const name = tLang(language)
  return locale === 'en' ? name : name.toLocaleLowerCase(locale)
}
