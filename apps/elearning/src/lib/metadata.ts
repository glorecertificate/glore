import { type Metadata, type ResolvingMetadata } from 'next'

import { asset, Asset } from '@/lib/storage'
import { getLocale, getTranslations, type MessageKey } from '@/services/i18n'
import app from 'config/app.json'
import i18n from 'config/i18n.json'

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
  title: app.title,
  applicationName: app.title,
  category: app.category,
  creator: app.author.name,
  authors: app.author,
  manifest: Asset.Manifest,
  robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  openGraph: {
    alternateLocale: i18n.defaultLocale,
    countryName: app.country,
    emails: app.email,
    images: app.image,
    phoneNumbers: app.phone,
    siteName: app.title,
    title: app.title,
    ttl: 60,
    url: app.url,
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
    title: app.title,
  },
}

/**
 * Merges the default metadata with the provided page metadata.
 */
export const appMetadata = async (props?: AppMetadata) => {
  const { description, image, separator = app.titleSeparator, title } = props ?? {}

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
  ({ description, image, separator = app.titleSeparator, title }: LocalizedAppMetadata) =>
  async (_: object, parent: ResolvingMetadata): Promise<Metadata> => {
    const t = await getTranslations()
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
