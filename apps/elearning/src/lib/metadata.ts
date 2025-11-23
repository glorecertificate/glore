import { type Metadata } from 'next'
import { type AppRoutes } from 'next/types/routes'

import { type Locale } from 'next-intl'
import { getLocale, getTranslations } from 'next-intl/server'

import metadata from '@config/metadata'
import { type Any, type HTTPUrl } from '@glore/utils/types'

import { getAlternateLocales, LOCALES, type MessageKey } from '@/lib/intl'
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
 * @template Translate - Boolean indicating whether to translate title and description.
 */
export interface MetadataOptions<Translate extends boolean = true> {
  applicationName?: boolean | 'full'
  description?: Translate extends true ? MessageKey : string
  image?: string
  translate?: Translate
  separator?: string
  title?: Translate extends true ? MessageKey : string
}

/**
 * Translates and merges the provided options with the defaults and returns a generator function.
 */
export const intlMetadata =
  <R extends AppRoutes, Translate extends boolean = true>(options: MetadataOptions<Translate> = {}) =>
  async (_: PageProps<R>) =>
    await createIntlMetadata<Translate>(options)

/**
 * Translates and merges asynchronously the provided values with the defaults.
 *
 * When `translate` is set to `true` (default behavior), title and description must be valid translation keys.
 */
export const createIntlMetadata = async <Translate extends boolean = true>(
  options: MetadataOptions<Translate> = {}
): Promise<Metadata> => {
  const {
    applicationName = true,
    description: userDescription,
    image,
    separator = metadata.separator,
    title: userTitle,
    translate = true,
  } = options

  const locale = await getLocale()
  const alternateLocale = getAlternateLocales(locale)
  const tMeta = await getTranslations('Metadata')
  const t = translate ? await getTranslations() : (key: string) => key

  const pageTitle = userTitle ? (translate ? t(userTitle as Any) : userTitle) : undefined
  const title = pageTitle
    ? applicationName
      ? `${pageTitle} ${separator} ${applicationName === 'full' ? metadata.name : metadata.shortName}`
      : pageTitle
    : tMeta('title')
  const description = userDescription ? (translate ? t(userDescription as Any) : userDescription) : tMeta('description')

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
