import { useCallback, useEffect, useMemo, useState } from 'react'

import { type Locale, useTranslations } from 'next-intl'

import metadata from '@config/metadata'

import { useI18n } from '@/hooks/use-i18n'
import { usePWA } from '@/hooks/use-pwa'
import { LOCALES, type Namespace, type NamespaceKey } from '@/lib/intl'
import { type ApiRoutes } from '@/lib/navigation'

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
const MANIFEST_ROUTE = '/api/manifest' satisfies ApiRoutes

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
  const { locale } = useI18n()
  const t = useTranslations(options.namespace)
  const tMeta = useTranslations('Metadata')
  const { displayMode } = usePWA()

  const initialTitleKey = options.titleKey
  const initialDescriptionKey = options.descriptionKey
  const initialImage = options.image

  const [titleKey, setTitleKey] = useState<NamespaceKey<T> | undefined>(initialTitleKey)
  const [descriptionKey, setDescriptionKey] = useState<NamespaceKey<T> | undefined>(initialDescriptionKey)

  const getMetaContent = useCallback((selectors: readonly string[]) => {
    if (typeof document === 'undefined') return
    for (const selector of selectors) {
      const element = document.querySelector<HTMLMetaElement>(selector)
      if (element) return element.content
    }
    return
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

  const [title, description] = useMemo(
    // @ts-expect-error
    () => [titleKey ? t(titleKey) : undefined, descriptionKey ? t(descriptionKey) : tMeta('description')],
    [t, titleKey, descriptionKey, tMeta]
  )

  const image = useMemo(() => getMetaContent(IMAGE_SELECTORS), [getMetaContent])

  const updateTitle = useCallback(() => {
    if (!title) return
    const content =
      displayMode === 'browser'
        ? `${title} ${metadata.separator} ${fullTitle ? metadata.name : metadata.shortName}`
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
      updateMetaSelectors([OG_ALTERNATE_LOCALE_SELECTOR], LOCALES.filter(l => l !== language)[0])
    },
    [updateLinkSelectors, updateMetaSelectors]
  )

  const setImage = useCallback((image: string) => updateMetaSelectors(IMAGE_SELECTORS, image), [updateMetaSelectors])

  useEffect(() => {
    if (initialTitleKey) setTitleKey(initialTitleKey)
    if (initialDescriptionKey) setDescriptionKey(initialDescriptionKey)
    if (initialImage) setImage(initialImage)
  }, [setImage, initialDescriptionKey, initialImage, initialTitleKey])

  useEffect(() => {
    setLanguage(locale)

    const id = setTimeout(() => {
      updateTitle()
      updateDescription()
    }, delay)

    return () => clearTimeout(id)
  }, [locale, delay, setLanguage, updateDescription, updateTitle])

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
