import type { Metadata } from 'next'
import type { AppRouteHandlerRoutes, AppRoutes } from 'next/types/routes'

import type { Locale } from 'next-intl'
import { getLocale, getTranslations } from 'next-intl/server'

import metadataConfig from '@config/metadata'
import type { Any } from '@glore/utils/types'

import { publicAsset } from '@/lib/assets'
import { i18n, type MessageKey } from '@/lib/i18n'

export const APP_URL = process.env.APP_URL
export const MANIFEST_ROUTE = '/api/v1/manifest' satisfies AppRouteHandlerRoutes

export const metadata = {
  metadataBase: APP_URL,
  applicationName: metadataConfig.shortName,
  category: metadataConfig.category,
  authors: metadataConfig.authors,
  creator: metadataConfig.authors[0].name,
  keywords: metadataConfig.keywords,
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
    emails: metadataConfig.email,
    images: [publicAsset('open-graph.png')],
    phoneNumbers: metadataConfig.phone,
    siteName: metadataConfig.name,
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
    title: metadataConfig.shortName,
    statusBarStyle: 'black-translucent',
    startupImage: publicAsset('web-app-screenshot-narrow.png'),
  },
} as const satisfies Metadata

export interface MetadataOptions<T extends boolean> {
  applicationName?: boolean | 'full'
  description?: T extends true ? MessageKey : string
  image?: string
  translate?: T
  separator?: string
  title?: T extends true ? MessageKey : string
}

/**
 * Translates and merges the provided values with the default metadata and returns a generator function.
 */
export const intlMetadata =
  <R extends AppRoutes, Translate extends boolean = true>(options: MetadataOptions<Translate> = {}) =>
  async (_: PageProps<R>) =>
    await createIntlMetadata<Translate>(options)

/**
 * Translates and merges asynchronously the provided values with the default metadata.
 *
 * When `translate` is set to `true` (default), title and description must be valid translation keys.
 */
export const createIntlMetadata = async <Translate extends boolean = true>(
  options: MetadataOptions<Translate> = {}
): Promise<Metadata> => {
  const {
    applicationName = true,
    description: userDescription,
    image,
    separator = metadataConfig.separator,
    title: userTitle,
    translate = true,
  } = options

  const tMeta = await getTranslations('Metadata')
  const t = translate ? await getTranslations() : (key: string) => key
  const locale = await getLocale()
  const alternateLocale = i18n.locales.filter(key => key !== locale)

  const pageTitle = userTitle ? (translate ? t(userTitle as Any) : userTitle) : undefined
  const title = pageTitle
    ? applicationName
      ? `${pageTitle} ${separator} ${applicationName === 'full' ? metadataConfig.name : metadataConfig.shortName}`
      : pageTitle
    : tMeta('title')
  const description = userDescription ? (translate ? t(userDescription as Any) : userDescription) : tMeta('description')

  const { openGraph, ...defaultMetadata } = metadata

  return {
    ...defaultMetadata,
    title,
    description,
    manifest: `${'/api/v1/manifest' satisfies AppRouteHandlerRoutes}?locale=${locale}`,
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
