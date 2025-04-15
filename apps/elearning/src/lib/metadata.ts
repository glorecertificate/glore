import { type Metadata, type ResolvingMetadata } from 'next'

import { asset, Asset } from '@/lib/storage'
import { getFlatTranslations, getLocale, type MessageKey } from '@/services/i18n'
import app from 'config/app.json'
import metadata from 'config/metadata.json'

/**
 * Generic page metadata.
 */
export interface AppMetadata {
  description?: string
  image?: string
  separator?: string
  title?: string
}

/**
 * Localized page metadata.
 */
export interface LocalizedAppMetadata {
  description?: MessageKey
  image?: string
  separator?: string
  title?: MessageKey
}

const defaults: Metadata = {
  title: metadata.title,
  applicationName: metadata.title,
  category: metadata.category,
  creator: metadata.author.name,
  authors: metadata.author,
  manifest: Asset.Manifest,
  robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  openGraph: {
    alternateLocale: app.defaultLocale,
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
      url: asset('favicon-96x96.png'),
    },
    {
      type: 'image/svg+xml',
      url: Asset.Logo,
    },
    {
      rel: 'shortcut icon',
      url: Asset.Favicon,
    },
    {
      rel: 'apple-touch-icon',
      sizes: '180x180',
      url: asset('apple-touch-icon.png'),
    },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: metadata.title,
  },
}

/**
 * Merges the default metadata with the provided page metadata.
 */
export const appMetadata = async (props?: AppMetadata) => {
  const { description, image, separator = metadata.titleSeparator, title } = props ?? {}

  const locale = await getLocale()
  const pageTitle = title ? `${title} ${separator} ${defaults.title as string}` : defaults.title

  return {
    ...defaults,
    title: pageTitle,
    ...(description ? { description } : {}),
    openGraph: {
      ...defaults.openGraph,
      ...(description ? { description } : {}),
      ...(image ? { images: image } : {}),
      locale: locale ?? defaults.openGraph?.locale,
    },
  } as Metadata
}

/**
 * Merges the default metadata with the provided page metadata and translates it.
 */
export const generateAppMetadata =
  ({ description, image, separator = metadata.titleSeparator, title }: LocalizedAppMetadata) =>
  async (_: object, parent: ResolvingMetadata): Promise<Metadata> => {
    const t = await getFlatTranslations()
    const locale = await getLocale()
    const previous = await parent

    const pageTitle = title ? `${t(title)} ${separator} ${defaults.title as string}` : defaults.title

    return {
      ...defaults,
      ...previous,
      title: pageTitle,
      ...(description ? { description: t(description) } : {}),
      openGraph: {
        ...defaults.openGraph,
        ...(description ? { description: t(description) } : {}),
        ...(image ? { images: image } : {}),
        locale: locale ?? defaults.openGraph?.locale,
      },
    } as Metadata
  }
