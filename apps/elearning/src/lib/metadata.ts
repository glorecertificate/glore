import { type Metadata, type ResolvingMetadata } from 'next'

import { type AnyRecord } from '@repo/utils'

import { getFlatTranslations, getLocale } from '@/lib/i18n/server'
import { type Locale, type MessageKey } from '@/lib/i18n/types'
import { LOCALES } from '@/lib/i18n/utils'
import { type PageProps, type Route } from '@/lib/navigation'
import { asset, Asset, Public } from '@/lib/storage'
import metadata from 'config/metadata.json'

export interface MetadataOptions<T extends boolean> {
  description?: T extends true ? MessageKey : string
  image?: string
  parent?: Metadata
  separator?: string
  translate?: T
  title?: T extends true ? MessageKey : string
}

export interface MetadataParams<T extends AnyRecord> {
  params: Promise<T>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const alternateLanguages = LOCALES.reduce(
  (languages, locale) => ({ ...languages, [locale]: `${metadata.url}?lang=${locale}` }),
  {} as Record<Locale, string>,
)

const DEFAULT_METADATA: Metadata = {
  applicationName: metadata.name,
  category: metadata.category,
  publisher: metadata.publisher,
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
  alternates: {
    canonical: metadata.url,
    languages: alternateLanguages,
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    emails: metadata.email,
    images: [asset(Asset.OpenGraph)],
    phoneNumbers: metadata.phone,
    siteName: metadata.name,
    ttl: 60,
  },
  icons: [
    {
      sizes: '96x96',
      type: 'image/png',
      url: asset(Asset.Favicon96),
    },
    {
      rel: 'shortcut icon',
      url: Public.Favicon,
    },
    {
      rel: 'apple-touch-icon',
      sizes: '180x180',
      url: asset(Asset.AppleIcon),
    },
  ],
  appleWebApp: {
    capable: true,
    title: metadata.name,
    statusBarStyle: 'black-translucent',
    startupImage: asset(Asset.WebAppScreenshotNarrow),
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

/**
 * Localizes and merges the provided values with the default metadata and
 * returns a function that generates metadata for a page.
 */
export const generatePageMetadata =
  <R extends Route, K extends AnyRecord = AnyRecord, T extends boolean = true>(options: MetadataOptions<T> = {}) =>
  async (_: PageProps<R, K>, parent: ResolvingMetadata) =>
    pageMetadata<T>({ ...options, parent: (await parent) as Metadata })

/**
 * Localizes the provided values and returns a complete metadata object.
 * Localization is skipped when the `static` flag is set to true.
 */
export const pageMetadata = async <T extends boolean = true>({
  description: userDescription,
  image,
  parent = {},
  separator = metadata.titleSeparator,
  title: userTitle,
  translate = true as T,
}: MetadataOptions<T>) => {
  const t = await getFlatTranslations()
  const locale = await getLocale()
  const alternateLocale = LOCALES[LOCALES.indexOf(locale) + 1] ?? LOCALES[0]

  const title = userTitle
    ? `${translate ? t(userTitle as MessageKey) : userTitle} ${separator} ${metadata.title}`
    : metadata.title
  const description = userDescription
    ? translate
      ? t(userDescription as MessageKey)
      : userDescription
    : metadata.description[locale]

  return {
    ...DEFAULT_METADATA,
    ...parent,
    title,
    description,
    openGraph: {
      ...DEFAULT_METADATA.openGraph,
      ...(parent.openGraph ?? {}),
      title,
      description,
      ...(image ? { images: image } : {}),
      locale,
      alternateLocale,
    },
  }
}
