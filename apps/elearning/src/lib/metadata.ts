import { type Metadata, type ResolvingMetadata } from 'next'

import { getFlatTranslations, getLocale } from '@/lib/i18n/server'
import { type MessageKey } from '@/lib/i18n/types'
import { asset, Public } from '@/lib/storage'
import config from 'config/app.json'
import metadata from 'config/metadata.json'

export interface PageMetadata {
  description?: string
  image?: string
  separator?: string
  title?: string
}

export interface LocalizedMetadata extends PageMetadata {
  description?: MessageKey
  title?: MessageKey
}

const METADATA: Metadata = {
  title: metadata.title,
  applicationName: metadata.title,
  category: metadata.category,
  creator: metadata.author.name,
  authors: metadata.author,
  manifest: Public.Manifest,
  robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  openGraph: {
    alternateLocale: config.defaultLocale,
    countryName: metadata.country,
    emails: metadata.email,
    images: metadata.image,
    phoneNumbers: metadata.phone,
    siteName: metadata.title,
    title: metadata.title,
    ttl: 60,
    url: metadata.url,
  },
  icons: [
    {
      sizes: '96x96',
      type: 'image/png',
      url: asset('metadata/favicon-96x96.png'),
    },
    {
      type: 'image/svg+xml',
      url: asset('assets/logo.png'),
    },
    {
      rel: 'shortcut icon',
      url: Public.Favicon,
    },
    {
      rel: 'configle-touch-icon',
      sizes: '180x180',
      url: asset('metadata/apple-touch-icon.png'),
    },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: metadata.title,
  },
}

/**
 * Merges the provided metadata with global metadata.
 */
export const generatePageMetadata = async (options?: PageMetadata): Promise<Metadata> => {
  const { description, image, separator = metadata.titleSeparator, title } = options ?? {}

  const locale = await getLocale()
  const pageTitle = title ? `${title} ${separator} ${METADATA.title as string}` : METADATA.title

  return {
    ...METADATA,
    title: pageTitle,
    ...(description ? { description } : {}),
    openGraph: {
      ...METADATA.openGraph,
      ...(description ? { description } : {}),
      ...(image ? { images: image } : {}),
      locale: locale ?? METADATA.openGraph?.locale,
    },
  }
}

/**
 * Localizes and merges the provided metadata with global metadata.
 */
export const generateLocalizedMetadata =
  ({ description, image, separator = metadata.titleSeparator, title }: LocalizedMetadata) =>
  async (_: object, parent: ResolvingMetadata): Promise<Metadata> => {
    const t = await getFlatTranslations()
    const locale = await getLocale()
    const previous = await parent

    const pageTitle = title ? `${t(title)} ${separator} ${METADATA.title as string}` : METADATA.title

    return {
      ...METADATA,
      ...previous,
      title: pageTitle,
      ...(description ? { description: t(description) } : {}),
      openGraph: {
        ...METADATA.openGraph,
        ...(description ? { description: t(description) } : {}),
        ...(image ? { images: image } : {}),
        locale: locale ?? METADATA.openGraph?.locale,
      },
    } as Metadata
  }
