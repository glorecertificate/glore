import { type AppRouteHandlerRoutes } from 'next/types/routes'
import { useCallback, useEffect, useMemo, useState } from 'react'

import metadata from '@config/metadata'
import { i18n, useLocale, useTranslations, type Locale, type Namespace, type NamespaceKey } from '@repo/i18n'
import { usePWA } from '@repo/ui/hooks/use-pwa'

const OG_TITLE_SELECTORS = ['meta[property="og:title"]', 'meta[name="twitter:title"]'] as const
const DESCRIPTION_SELECTOR = 'meta[name="description"]' as const
const OG_DESCRIPTION_SELECTORS = [
  'meta[property="og:description"]',
  'meta[name="twitter:description"]',
  'meta[itemprop="description"]',
] as const
const OG_LOCALE_SELECTOR = 'meta[property="og:locale"]' as const
const OG_ALTERNATE_LOCALE_SELECTOR = 'meta[property="og:locale:alternate"]' as const
const IMAGE_SELECTORS = ['meta[property="og:image"]', 'meta[name="twitter:image"]', 'meta[itemprop="image"]'] as const
const MANIFEST_SELECTOR = 'link[rel="manifest"]'
const MANIFEST_ROUTE = '/api/manifest' satisfies AppRouteHandlerRoutes

export const useMetadata = <T extends Namespace = never>({
  delay = 200,
  fullTitle = false,
  ogDescription = false,
  ogTitle = false,
  ...options
}: {
  namespace?: T
  titleKey?: NamespaceKey<T>
  descriptionKey?: NamespaceKey<T>
  image?: string
  /** @default false */
  fullTitle?: boolean
  /** @default false */
  ogTitle?: boolean
  /** @default false */
  ogDescription?: boolean
  /** @default 200 */
  delay?: number
} = {}) => {
  const { locale } = useLocale()
  const t = useTranslations(options.namespace)
  const tApp = useTranslations('App')
  const { displayMode } = usePWA()

  const [titleKey, setTitleKey] = useState<NamespaceKey<T> | undefined>(options.titleKey)
  const [descriptionKey, setDescriptionKey] = useState<NamespaceKey<T> | undefined>(options.descriptionKey)

  const getMetaContent = useCallback((selectors: readonly string[]) => {
    if (typeof document === 'undefined') return undefined
    for (const selector of selectors) {
      const element = document.querySelector<HTMLMetaElement>(selector)
      if (element) return element.content
    }
    return undefined
  }, [])

  const updateMetaSelectors = useCallback((selectors: readonly string[], value: string) => {
    for (const selector of selectors) {
      const element = document.querySelector<HTMLMetaElement>(selector)
      if (!element) continue
      element.content = value
    }
  }, [])

  const updateLinkSelectors = useCallback((selectors: readonly string[], value: string) => {
    for (const selector of selectors) {
      const element = document.querySelector<HTMLLinkElement>(selector)
      if (!element) continue
      element.href = value
    }
  }, [])

  const title = useMemo(() => (titleKey ? t.dynamic(titleKey) : undefined), [t, titleKey])

  const description = useMemo(
    () => (descriptionKey ? t.dynamic(descriptionKey) : tApp('description')),
    [descriptionKey, t, tApp],
  )

  const image = useMemo(() => getMetaContent(IMAGE_SELECTORS), [getMetaContent])

  const updateTitle = useCallback(() => {
    if (!title) return
    const content =
      displayMode === 'browser'
        ? `${title} ${metadata.titleSeparator} ${fullTitle ? metadata.title : metadata.name}`
        : title
    document.title = content
    if (!ogTitle) return
    updateMetaSelectors(OG_TITLE_SELECTORS, content)
  }, [displayMode, fullTitle, ogTitle, title, updateMetaSelectors])

  const updateDescription = useCallback(() => {
    if (!description) return
    updateMetaSelectors([DESCRIPTION_SELECTOR], description)
    if (!ogDescription) return
    updateMetaSelectors(OG_DESCRIPTION_SELECTORS, description)
  }, [description, ogDescription, updateMetaSelectors])

  const setLanguage = useCallback(
    (language: Locale) => {
      const html = document.querySelector('html')!
      html.setAttribute('lang', language)
      updateMetaSelectors([OG_LOCALE_SELECTOR], language)
      updateLinkSelectors([MANIFEST_SELECTOR], `${MANIFEST_ROUTE}?locale=${language}`)
      updateMetaSelectors([OG_ALTERNATE_LOCALE_SELECTOR], i18n.locales.filter(l => l !== language)[0])
    },
    [updateLinkSelectors, updateMetaSelectors],
  )

  const setImage = useCallback((image: string) => updateMetaSelectors(IMAGE_SELECTORS, image), [updateMetaSelectors])

  useEffect(() => {
    if (!options) return
    if (options.titleKey) setTitleKey(options.titleKey)
    if (options.descriptionKey) setDescriptionKey(options.descriptionKey)
    if (options.image) setImage(options.image)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setLanguage(locale)

    const id = setTimeout(() => {
      updateTitle()
      updateDescription()
    }, delay)

    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [description, locale, title])

  return {
    title,
    titleKey,
    setTitleKey,
    description,
    descriptionKey,
    setDescriptionKey,
    image,
    setImage,
  }
}
