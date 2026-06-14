import { type Metadata, Route, type Viewport } from 'next'

import { LOCALES, type MessageKey, type Namespace } from '@/lib/i18n'
import { type HttpUrl } from '@/lib/types'
import { publicFile } from '@/lib/utils'
import config from '~/config/metadata.json'

const APP_URL = process.env.APP_URL as HttpUrl
export const APP_NAME = config.name
export const APP_SEPARATOR = config.separator

export const WEBSITE_URL = config.website as HttpUrl
export const MANIFEST_URL = '/api/v1/manifest' satisfies Route

const languages = LOCALES.reduce(
  (langs, locale) => ({
    ...langs,
    [locale]: `${APP_URL}?lang=${locale}`,
  }),
  {}
)

export const metadata: Metadata = {
  metadataBase: APP_URL,
  applicationName: config.shortName,
  category: config.category,
  keywords: config.keywords,
  alternates: {
    canonical: APP_URL,
    languages,
  },
  authors: config.authors,
  creator: config.authors[0].name,
  formatDetection: {
    telephone: false,
  },
  icons: [
    {
      rel: 'shortcut icon',
      url: publicFile('/favicon.ico'),
    },
    {
      sizes: '96x96',
      type: 'image/png',
      url: publicFile('/favicon-96x96.png'),
    },
    {
      rel: 'apple-touch-icon',
      sizes: '180x180',
      url: publicFile('/apple-icon.png'),
    },
  ],
  openGraph: {
    type: 'website',
    emails: config.email,
    images: [publicFile('/og-image.png')],
    phoneNumbers: config.phone,
    siteName: APP_NAME,
    ttl: 60,
    url: APP_URL,
  },
  appleWebApp: {
    capable: true,
    title: config.shortName,
    statusBarStyle: 'black-translucent',
    startupImage: publicFile('/web-app-screenshot-narrow.png'),
  },
  robots: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
    'max-snippet': -1,
    'max-video-preview': -1,
  },
}

export const viewport: Viewport = {
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#efefef',
  userScalable: false,
  width: 'device-width',
}

interface IntlMetadataOptions<T extends Namespace> extends Omit<Metadata, 'title' | 'description'> {
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
  ...options
}: IntlMetadataOptions<T>) => {
  const { getTranslations } = await import('next-intl/server')
  const t = await getTranslations(namespace)
  const translate = t as unknown as (key: MessageKey<T>) => string
  const resolve = (key?: MessageKey<T>) => (key && t.has(key) ? translate(key) : undefined)

  return {
    ...options,
    title:
      typeof title === 'object'
        ? {
            default: resolve(title?.default),
            template: resolve(title?.template),
            absolute: resolve(title?.absolute),
          }
        : resolve(title),
    description: resolve(description),
  }
}

export const generateIntlMetadata =
  <T extends Namespace>(options: IntlMetadataOptions<T>) =>
  () =>
    intlMetadata(options)
