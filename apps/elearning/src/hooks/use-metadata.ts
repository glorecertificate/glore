'use client'

import { useCallback, useEffect } from 'react'

import { useLocale } from 'next-intl'

import metadata from '@config/metadata'

import { usePWA } from '@/hooks/use-pwa'
import { LOCALES } from '@/lib/intl'
import { apiRoute } from '@/lib/navigation'

const TITLE_SELECTORS = ['[property="og:title"]', '[name="twitter:title"]']
const DESCRIPTION_SELECTORS = [
  '[name="description"]',
  '[property="og:description"]',
  '[name="twitter:description"]',
  '[itemprop="description"]',
]
const LOCALE_SELECTOR = '[property="og:locale"]'
const ALTERNATE_LOCALE_SELECTOR = '[property="og:locale:alternate"]'
const IMAGE_SELECTORS = ['[property="og:image"]', '[name="twitter:image"]', '[itemprop="image"]']
const MANIFEST_SELECTOR = '[rel="manifest"]'
const MANIFEST_ROUTE = apiRoute('/api/manifest')

const getMetaContent = (selector: string | string[]) => {
  if (typeof document === 'undefined') return
  for (const attribute of Array.isArray(selector) ? selector : [selector]) {
    const element = document.querySelector<HTMLMetaElement>(attribute)
    if (element) return element.content
  }
}

const updateMetaContent = (selector: string | string[], value: string) => {
  if (typeof document === 'undefined') return
  for (const attribute of Array.isArray(selector) ? selector : [selector]) {
    const element = document.querySelector<HTMLMetaElement>(attribute)
    if (element) element.content = value
  }
}

const updateLinkSelector = (selector: string | string[], value: string) => {
  if (typeof document === 'undefined') return
  for (const attribute of Array.isArray(selector) ? selector : [selector]) {
    const element = document.querySelector<HTMLLinkElement>(attribute)
    if (element) element.href = value
  }
}

export interface UseMetadataOptions {
  /**
   * Whether to show the application name in the document title.
   * @default true
   */
  applicationName?: boolean | 'full'
  /**
   * Delay in milliseconds before updating the metadata.
   * @default 100
   */
  delay?: number
  /**
   * Description for the metadata.
   */
  description?: string
  /**
   * Image URL for the metadata.
   */
  image?: string
  /**
   * Title for the metadata.
   */
  title?: string
}

export const useMetadata = ({ applicationName = true, delay = 100, ...options }: UseMetadataOptions) => {
  const locale = useLocale()
  const { displayMode } = usePWA()

  const setTitle = useCallback(
    (title: string) => {
      const content =
        displayMode === 'browser' && applicationName
          ? `${title} ${metadata.separator} ${applicationName === 'full' ? metadata.name : metadata.shortName}`
          : title
      document.title = content
      updateMetaContent(TITLE_SELECTORS, content)
    },
    [applicationName, displayMode]
  )

  const setDescription = useCallback((description: string) => {
    updateMetaContent(DESCRIPTION_SELECTORS, description)
  }, [])

  const setImage = useCallback((image: string) => updateMetaContent(IMAGE_SELECTORS, image), [])

  useEffect(() => {
    if (!(options.title || options.description || options.image)) return

    const id = setTimeout(() => {
      if (options.title) setTitle(options.title)
      if (options.description) setDescription(options.description)
      if (options.image) setImage(options.image)
    }, delay)

    return () => clearTimeout(id)
  }, [delay, options.title, options.description, options.image, setTitle, setDescription, setImage])

  useEffect(() => {
    const html = document.querySelector('html')!
    html.setAttribute('lang', locale)
    updateMetaContent(LOCALE_SELECTOR, locale)
    updateLinkSelector(MANIFEST_SELECTOR, `${MANIFEST_ROUTE}?locale=${locale}`)
    updateMetaContent(ALTERNATE_LOCALE_SELECTOR, LOCALES.filter(l => l !== locale)[0])
  }, [locale])

  return {
    description: getMetaContent(DESCRIPTION_SELECTORS),
    image: getMetaContent(IMAGE_SELECTORS),
    setDescription,
    setImage,
    setTitle,
    title: typeof document === 'undefined' ? undefined : document.title,
  }
}
