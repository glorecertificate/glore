import { type Metadata, type Viewport } from 'next'

import { type Locale } from 'next-intl'

import { metadata as config } from '@config/app'
import { i18n, type MessageKey, type Namespace } from '@/lib/i18n'
import { publicAsset } from '@/lib/storage'
import { type Any, type HttpUrl } from '@/lib/types'

export const APP_URL = process.env.APP_URL as HttpUrl
export const WEBSITE_URL = config.website as HttpUrl
export const MANIFEST_URL = '/api/v1/manifest'

export const viewport: Viewport = {
  themeColor: '#efefef',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

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
    images: [publicAsset('og-image.png')],
    phoneNumbers: config.phone,
    siteName: config.name,
    ttl: 60,
    url: APP_URL,
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

export interface IntlMetadata<T extends Namespace> extends Omit<Metadata, 'title' | 'description'> {
  namespace?: T
  title?:
    | MessageKey<T>
    | {
        default?: MessageKey<T>
        template?: MessageKey<T>
        absolute?: MessageKey<T>
      }
  description?: MessageKey<T>
}

export const intlMetadata = async <T extends Namespace>({
  namespace,
  title,
  description,
  ...metadata
}: IntlMetadata<T> = {}) => {
  const { getTranslations } = await import('next-intl/server')
  const t: Any = await getTranslations(namespace)

  return {
    ...metadata,
    title:
      typeof title === 'object'
        ? {
            default: title?.default ? t(title.default) : undefined,
            template: title?.template ? t(title.template) : undefined,
            absolute: title?.absolute ? t(title.absolute) : undefined,
          }
        : title
          ? t(title)
          : undefined,
    description: description ? t(description) : undefined,
  }
}
