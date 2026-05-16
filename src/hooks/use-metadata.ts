'use client'

import { useEffect } from 'react'

import { useLocale } from 'next-intl'

import { usePWA } from '@/hooks/use-pwa'
import { i18n } from '@/lib/i18n'
import { MANIFEST_URL } from '@/lib/metadata'
import metadata from '~/config/metadata.json'

const metaSelectors = {
  alternateLocale: '[property="og:locale:alternate"]',
  description: [
    '[name="description"]',
    '[property="og:description"]',
    '[name="twitter:description"]',
    '[itemprop="description"]',
  ],
  image: ['[property="og:image"]', '[name="twitter:image"]', '[itemprop="image"]'],
  locale: '[property="og:locale"]',
  manifest: '[rel="manifest"]',
  title: ['[property="og:title"]', '[name="twitter:title"]'],
}

const getMetaContent = (selector: keyof typeof metaSelectors) => {
  if (typeof document === 'undefined') {
    return
  }
  const selectors = metaSelectors[selector]
  for (const attribute of Array.isArray(selectors) ? selectors : [selectors]) {
    const element = document.querySelector<HTMLMetaElement>(attribute)
    if (element) {
      return element.content
    }
  }
}

const updateMetaContent = (selector: keyof typeof metaSelectors, value: string) => {
  if (typeof document === 'undefined') {
    return
  }
  const selectors = metaSelectors[selector]
  for (const attribute of Array.isArray(selectors) ? selectors : [selectors]) {
    const element = document.querySelector<HTMLMetaElement>(attribute)
    if (element) {
      element.content = value
    }
  }
}

const updateLinkSelector = (selector: string | string[], value: string) => {
  if (typeof document === 'undefined') {
    return
  }
  for (const attribute of Array.isArray(selector) ? selector : [selector]) {
    const element = document.querySelector<HTMLLinkElement>(attribute)
    if (element) {
      element.href = value
    }
  }
}

interface UseMetadataOptions {
  /**
   * Whether to show the application name in the document title.
   * @default true
   */
  applicationName?: boolean | 'short' | 'full'
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

/**
 * Manage and update metadata title, description, and image.
 */
export const useMetadata = ({ applicationName = true, delay = 100, ...options }: UseMetadataOptions) => {
  const locale = useLocale()
  const { displayMode } = usePWA()

  const title = typeof document === 'undefined' ? undefined : document.title
  const description = getMetaContent('description')
  const image = getMetaContent('image')

  const setTitle = (newTitle: string) => {
    const content =
      displayMode === 'browser' && applicationName
        ? `${newTitle} ${metadata.separator} ${applicationName === 'short' ? metadata.shortName : metadata.name}`
        : newTitle
    document.title = content
    updateMetaContent('title', content)
  }

  const setDescription = (newDescription: string) => {
    updateMetaContent('description', newDescription)
  }

  const setImage = (newImage: string) => updateMetaContent('image', newImage)

  useEffect(() => {
    if (!(options.title || options.description || options.image)) {
      return
    }

    const timeout = setTimeout(() => {
      if (options.title) {
        const content =
          displayMode === 'browser' && applicationName
            ? `${options.title} ${metadata.separator} ${applicationName === 'full' ? metadata.name : metadata.shortName}`
            : options.title
        document.title = content
        updateMetaContent('title', content)
      }
      if (options.description) {
        updateMetaContent('description', options.description)
      }
      if (options.image) {
        updateMetaContent('image', options.image)
      }
    }, delay)

    return () => {
      clearTimeout(timeout)
    }
  }, [applicationName, delay, displayMode, options.description, options.image, options.title])

  useEffect(() => {
    const html = document.querySelector('html')!
    html.setAttribute('lang', locale)
    updateMetaContent('locale', locale)
    updateLinkSelector('manifest', `${MANIFEST_URL}?locale=${locale}`)
    updateMetaContent('alternateLocale', i18n.locales.filter(l => l !== locale)[0])
  }, [locale])

  return {
    description,
    image,
    setDescription,
    setImage,
    setTitle,
    title,
  }
}
