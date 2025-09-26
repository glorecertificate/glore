import { type Metadata } from 'next'
import { type AppRoutes } from 'next/types/routes'

import metadata from '@config/metadata'
import { i18n, type Locale, type MessageKey } from '@repo/i18n'

import { env } from '@/lib/env'
import { getLocale, getTranslations } from '@/lib/i18n'
import { Public } from '@/lib/storage'

/**
 * Options for generating metadata.
 *
 * The `Translate` generic determines whether localization should be applied to title and description.
 */
export interface MetadataOptions<Translate extends boolean> {
  description?: Translate extends true ? MessageKey : string
  image?: string
  separator?: string
  translate?: Translate
  title?: Translate extends true ? MessageKey : string
}

const DEFAULT_METADATA = {
  metadataBase: new URL(env.APP_URL),
  applicationName: metadata.name,
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
    canonical: env.APP_URL,
    languages: i18n.locales.reduce(
      (languages, lang) => ({ ...languages, [lang]: `${env.APP_URL}?lang=${lang}` }),
      {} as Record<Locale, string>,
    ),
  },
  openGraph: {
    type: 'website',
    emails: metadata.email,
    images: [Public.OpenGraph],
    phoneNumbers: metadata.phone,
    siteName: metadata.name,
    ttl: 60,
  },
  icons: [
    {
      rel: 'shortcut icon',
      url: Public.Favicon,
    },
    {
      sizes: '96x96',
      type: 'image/png',
      url: Public.Favicon96,
    },
    {
      rel: 'apple-touch-icon',
      sizes: '180x180',
      url: Public.AppleIcon,
    },
  ],
  appleWebApp: {
    capable: true,
    title: metadata.name,
    statusBarStyle: 'black-translucent',
    startupImage: Public.WebAppScreenshotNarrow,
  },
} as const satisfies Metadata

/**
 * Merges the provided values with the default metadata and returns a metadata generator function.
 *
 * The `translate` flag determines whether localization should be applied. When set to true, title
 * and description must be valid localization keys.
 */
export const createMetadata =
  <R extends AppRoutes, T extends boolean>(options: MetadataOptions<T> = {}) =>
  async (_: PageProps<R>) =>
    createAsyncMetadata<T>(options)

/**
 * Asynchronously generates metadata by merging the provided options with the default metadata.
 *
 * The `translate` flag determines whether localization should be applied. When set to true (default),
 * title and description must be valid localization keys.
 */
export const createAsyncMetadata = async <T extends boolean>(options: MetadataOptions<T> = {}): Promise<Metadata> => {
  const {
    description: userDescription,
    image,
    separator = metadata.titleSeparator,
    title: userTitle,
    translate = true,
  } = options

  const t = await getTranslations()
  const locale = await getLocale()
  const alternateLocale = i18n.locales.filter(language => language !== locale)[0]

  const title = userTitle
    ? `${translate ? t.dynamic(userTitle) : userTitle} ${separator} ${metadata.title}`
    : metadata.title
  const description = userDescription
    ? translate
      ? t.dynamic(userDescription)
      : userDescription
    : t('App.description')

  const { openGraph, ...defaultMetadata } = DEFAULT_METADATA

  return {
    ...defaultMetadata,
    title,
    description,
    manifest: `${Public.Manifest}?locale=${locale}`,
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
