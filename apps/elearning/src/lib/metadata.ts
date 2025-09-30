import { type Metadata } from 'next'
import { type AppRoutes } from 'next/types/routes'

import metadata from '@config/metadata'
import { i18n, type Locale, type MessageKey } from '@glore/i18n'

import { PublicAsset } from '@/lib/assets'
import { getLocale, getTranslations } from '@/lib/i18n'

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
  metadataBase: new URL(process.env.APP_URL),
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
    canonical: process.env.APP_URL,
    languages: i18n.locales.reduce(
      (languages, lang) => ({ ...languages, [lang]: `${process.env.APP_URL}?lang=${lang}` }),
      {} as Record<Locale, string>
    ),
  },
  openGraph: {
    type: 'website',
    emails: metadata.email,
    images: [PublicAsset.OpenGraph],
    phoneNumbers: metadata.phone,
    siteName: metadata.name,
    ttl: 60,
  },
  icons: [
    {
      rel: 'shortcut icon',
      url: PublicAsset.Favicon,
    },
    {
      sizes: '96x96',
      type: 'image/png',
      url: PublicAsset.Favicon96,
    },
    {
      rel: 'apple-touch-icon',
      sizes: '180x180',
      url: PublicAsset.AppleIcon,
    },
  ],
  appleWebApp: {
    capable: true,
    title: metadata.shortName,
    statusBarStyle: 'black-translucent',
    startupImage: PublicAsset.WebAppScreenshotNarrow,
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
    separator = metadata.separator,
    title: userTitle,
    translate = true,
  } = options

  const t = await getTranslations()
  const locale = await getLocale()
  const alternateLocale = i18n.locales.filter(language => language !== locale)[0]

  const title = userTitle
    ? `${translate ? t.dynamic(userTitle) : userTitle} ${separator} ${metadata.name}`
    : metadata.name
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
    manifest: `${PublicAsset.Manifest}?locale=${locale}`,
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
