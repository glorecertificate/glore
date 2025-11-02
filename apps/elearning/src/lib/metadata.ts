import { type Metadata } from 'next'
import { type AppRoutes } from 'next/types/routes'

import { type Locale } from 'next-intl'
import { getLocale, getTranslations } from 'next-intl/server'

import metadata from '@config/metadata'
import { type HTTPUrl } from '@glore/utils/types'

import { LOCALES, type NavigationKey } from '@/lib/intl'
import { apiRoute } from '@/lib/navigation'
import { publicAsset } from '@/lib/storage'

export const APP_NAME = metadata.shortName
export const APP_URL = process.env.APP_URL as HTTPUrl

export const METADATA = {
  metadataBase: APP_URL,
  applicationName: metadata.shortName,
  category: metadata.category,
  authors: metadata.authors,
  creator: metadata.authors[0].name,
  keywords: metadata.keywords,
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
    languages: LOCALES.reduce(
      (languages, lang) => ({ ...languages, [lang]: `${APP_URL}?lang=${lang}` }),
      {} as Record<Locale, string>
    ),
  },
  openGraph: {
    type: 'website',
    emails: metadata.email,
    images: [publicAsset('open-graph.png')],
    phoneNumbers: metadata.phone,
    siteName: metadata.name,
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
    title: metadata.shortName,
    statusBarStyle: 'black-translucent',
    startupImage: publicAsset('web-app-screenshot-narrow.png'),
  },
} as const satisfies Metadata

/**
 * Options for generating metadata.
 *
 * @template T - Boolean indicating whether to translate title and description.
 */
export interface MetadataOptions<T extends boolean> {
  description?: T extends true ? NavigationKey : string
  image?: string
  separator?: string
  translate?: T
  title?: T extends true ? NavigationKey : string
}

/**
 * Translates and merges the provided options with the defaults and returns a generator function.
 */
export const intlMetadata =
  <R extends AppRoutes, T extends boolean = true>(options: MetadataOptions<T> = {}) =>
  async (_: PageProps<R>) =>
    await createMetadata<T>(options)

/**
 * Translates and merges asynchronously the provided values with the defaults.
 *
 * When `translate` is set to `true` (default behavior), title and description must be valid translation keys.
 */
export const createMetadata = async <T extends boolean>(options: MetadataOptions<T> = {}): Promise<Metadata> => {
  const {
    description: userDescription,
    image,
    separator = metadata.separator,
    title: userTitle,
    translate = true,
  } = options

  const tNav = await getTranslations('Navigation')
  const t = await getTranslations('Metadata')
  const locale = await getLocale()
  const alternateLocale = LOCALES.filter(language => language !== locale)[0]

  const title = userTitle
    ? `${translate ? tNav(userTitle as NavigationKey) : userTitle} ${separator} ${metadata.name}`
    : metadata.name
  const description = userDescription
    ? translate
      ? tNav(userDescription as NavigationKey)
      : userDescription
    : t('description')

  const { openGraph, ...defaultMetadata } = METADATA

  return {
    ...defaultMetadata,
    title,
    description,
    manifest: `${apiRoute('/api/manifest')}?locale=${locale}`,
    openGraph: {
      ...openGraph,
      title,
      description,
      ...(image ? { images: image } : {}),
      locale,
      alternateLocale,
    },
  }
}
