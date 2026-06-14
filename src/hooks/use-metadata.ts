'use client'

import { useEffect } from 'react'

import { useLocale } from 'next-intl'

import { usePWA } from '@/hooks/use-pwa'
import { LOCALES } from '@/lib/i18n'
import { MANIFEST_URL } from '@/lib/metadata'
import metadata from '~/config/metadata.json'

const METADATA_SELECTORS = {
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
} as const

const getMetaContent = (selector: keyof typeof METADATA_SELECTORS) => {
  if (typeof document === 'undefined') return
  const selectors = METADATA_SELECTORS[selector]
  for (const attribute of Array.isArray(selectors) ? selectors : [selectors]) {
    const element = document.querySelector<HTMLMetaElement>(attribute)
    if (element) return element.content
  }
}

const updateMetaContent = (selector: keyof typeof METADATA_SELECTORS, value: string) => {
  if (typeof document === 'undefined') return
  const selectors = METADATA_SELECTORS[selector]
  for (const attribute of Array.isArray(selectors) ? selectors : [selectors]) {
    const element = document.querySelector<HTMLMetaElement>(attribute)
    if (element) element.content = value
  }
}

const updateLink = (selector: string | string[], value: string) => {
  if (typeof document === 'undefined') return
  for (const attribute of Array.isArray(selector) ? selector : [selector]) {
    const element = document.querySelector<HTMLLinkElement>(attribute)
    if (element) element.href = value
  }
}

const setDescription = (value: string) => updateMetaContent('description', value)

const setImage = (value: string) => updateMetaContent('image', value)

/**
 * Manage and update metadata title, description, and image.
 */
export const useMetadata = ({
  delay = 100,
  separator = metadata.separator,
  suffix = metadata.name,
  ...options
}: {
  /**
   * Delay in milliseconds before updating the metadata.
   * Useful to prevent layout shifts during page load.
   * @default 100
   */
  delay?: number
  /**
   * Metadata description to be set.
   */
  description?: string
  /**
   * URL of the metadata image to be set.
   */
  image?: string
  /**
   * Separator to use between title and suffix in browser display mode.
   * Defaults to {@link metadata.separator}.
   */
  separator?: string
  /**
   * Suffix to append to the title when in browser display mode.
   * Defaults to {@link metadata.name}.
   */
  suffix?: string | false
  /**
   * Metadata title to be set.
   * Use `suffix` to append other content in browser display mode.
   */
  title?: string
}) => {
  const locale = useLocale()
  const { displayMode } = usePWA()

  const title = typeof document === 'undefined' ? undefined : document.title
  const titleSuffix = displayMode === 'browser' && suffix !== false ? ` ${separator} ${suffix}` : ''
  const description = getMetaContent('description')
  const image = getMetaContent('image')

  const setTitle = (value: string) => {
    const content = `${value}${titleSuffix}`
    document.title = content
    updateMetaContent('title', content)
  }

  useEffect(() => {
    if (!(options.title || options.description || options.image)) return

    const timeout = setTimeout(() => {
      if (options.title) {
        const content = `${options.title}${titleSuffix}`
        document.title = content
        updateMetaContent('title', content)
      }
      if (options.description) updateMetaContent('description', options.description)
      if (options.image) updateMetaContent('image', options.image)
    }, delay)

    return () => clearTimeout(timeout)
  }, [delay, options.description, options.image, options.title, titleSuffix])

  useEffect(() => {
    const html = document.querySelector('html')!
    html.setAttribute('lang', locale)
    updateMetaContent('locale', locale)
    updateLink('manifest', `${MANIFEST_URL}?locale=${locale}`)
    updateMetaContent('alternateLocale', LOCALES.filter(alternate => alternate !== locale)[0])
  }, [locale])

  return {
    title,
    setTitle,
    description,
    setDescription,
    image,
    setImage,
  }
}
