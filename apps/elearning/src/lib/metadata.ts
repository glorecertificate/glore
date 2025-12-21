import type { Metadata } from 'next'

import type { Locale } from 'next-intl'
import { getLocale, getTranslations } from 'next-intl/server'

import type { Any, HttpUrl } from '@glore/utils/types'

import { metadata as config } from '@static/config'
import { i18n, type MessageKey } from '@/lib/i18n'
import { publicAsset } from '@/lib/storage'

export const APP_URL = process.env.APP_URL as HttpUrl
export const WEBSITE_URL = config.website as HttpUrl
export const MANIFEST_URL = '/api/v1/manifest'

export const metadata = {
  metadataBase: APP_URL,
  applicationName: config.shortName,
  category: config.category,
  authors: config.authors,
  creator: config.authors[0].name,
  keywords: config.keywords,
  robots: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
    'max-snippet': -1,
    'max-video-preview': -1,
  },
  formatDetection: {
    telephone: false,
  },
  alternates: {
    canonical: APP_URL,
    languages: i18n.locales.reduce(
      (languages, lang) => ({ ...languages, [lang]: `${APP_URL}?lang=${lang}` }),
      {} as Record<Locale, string>
    ),
  },
  openGraph: {
    type: 'website',
    emails: config.email,
    images: [publicAsset('open-graph.png')],
    phoneNumbers: config.phone,
    siteName: config.name,
    ttl: 60,
  },
  icons: [
    {
      rel: 'shortcut icon',
      url: publicAsset('favicon.ico'),
    },
    {
      sizes: '96x96',
      type: 'image/png',
      url: publicAsset('favicon-96x96.png'),
    },
    {
      rel: 'apple-touch-icon',
      sizes: '180x180',
      url: publicAsset('apple-icon.png'),
    },
  ],
  appleWebApp: {
    capable: true,
    title: config.shortName,
    statusBarStyle: 'black-translucent',
    startupImage: publicAsset('web-app-screenshot-narrow.png'),
  },
} satisfies Metadata

export interface MetadataOptions<T extends boolean> {
  applicationName?: boolean | 'full'
  description?: T extends true ? MessageKey : string
  image?: string
  translate?: T
  separator?: string
  title?: T extends true ? MessageKey : string
}

/**
 * Asynchronously translates and merges the provided values with the default metadata.
 *
 * When `translate` is set to `true` (default behavior), title and description must be valid translation keys.
 */
export const intlMetadata = async <Translate extends boolean = true>(
  options: MetadataOptions<Translate> = {}
): Promise<Metadata> => {
  const {
    applicationName = true,
    description: userDescription,
    image,
    separator = config.separator,
    title: userTitle,
    translate = true,
  } = options

  const tMetadata = await getTranslations('Metadata')
  const t = translate ? await getTranslations() : (key: Any) => key
  const locale = await getLocale()
  const alternateLocale = i18n.locales.filter(key => key !== locale)

  const pageTitle = userTitle ? (translate ? t(userTitle) : userTitle) : undefined
  const title = pageTitle
    ? applicationName
      ? `${pageTitle} ${separator} ${applicationName === 'full' ? config.name : config.shortName}`
      : pageTitle
    : tMetadata('title')
  const description = userDescription ? (translate ? t(userDescription) : userDescription) : tMetadata('description')

  const { openGraph, ...defaultMetadata } = metadata

  return {
    ...defaultMetadata,
    title,
    description,
    manifest: `${MANIFEST_URL}?locale=${locale}`,
    openGraph: {
      ...openGraph,
      ...(image ? { images: image } : {}),
      title,
      description,
      locale,
      alternateLocale,
    },
  }
}
