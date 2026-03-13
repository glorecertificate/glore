import { type Metadata, Route, type Viewport } from 'next'

import { type MessageKey, type Namespace, i18n } from '@/lib/i18n'
import { type Any, type HttpUrl } from '@/lib/types'
import { publicFile } from '@/lib/utils'
import config from '~/config/metadata.json'

const APP_URL = process.env.APP_URL as HttpUrl
export const WEBSITE_URL = config.website as HttpUrl
export const MANIFEST_URL = '/api/v1/manifest' satisfies Route

const languages = i18n.locales.reduce((a, l) => ({ ...a, [l]: `${APP_URL}?lang=${l}` }), {})

export const metadata = {
  alternates: { canonical: APP_URL, languages },
  appleWebApp: {
    capable: true,
    title: config.shortName,
    statusBarStyle: 'black-translucent',
    startupImage: publicFile('/web-app-screenshot-narrow.png'),
  },
  applicationName: config.shortName,
  authors: config.authors,
  category: config.category,
  creator: config.authors[0].name,
  formatDetection: { telephone: false },
  icons: [
    { rel: 'shortcut icon', url: publicFile('/favicon.ico') },
    { sizes: '96x96', type: 'image/png', url: publicFile('/favicon-96x96.png') },
    { rel: 'apple-touch-icon', sizes: '180x180', url: publicFile('/apple-icon.png') },
  ],
  keywords: config.keywords,
  metadataBase: APP_URL,
  openGraph: {
    type: 'website',
    emails: config.email,
    images: [publicFile('/og-image.png')],
    phoneNumbers: config.phone,
    siteName: config.name,
    ttl: 60,
    url: APP_URL,
  },
  robots: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
} satisfies Metadata

export const viewport: Viewport = {
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#efefef',
  userScalable: false,
  width: 'device-width',
}

export const intlMetadata = async <T extends Namespace>({
  namespace,
  title,
  description,
  ...metadata
}: Omit<Metadata, 'title' | 'description'> & {
  namespace?: T
  title?: MessageKey<T> | { default?: MessageKey<T>; template?: MessageKey<T>; absolute?: MessageKey<T> }
  description?: MessageKey<T>
} = {}) => {
  const { getTranslations } = await import('next-intl/server')
  const t: Any = await getTranslations(namespace)

  const resolveKey = (key?: string) => (key && t.has(key) ? t(key) : undefined)

  return {
    ...metadata,
    description: resolveKey(description),
    title:
      typeof title === 'object'
        ? {
            default: resolveKey(title?.default),
            template: resolveKey(title?.template),
            absolute: resolveKey(title?.absolute),
          }
        : resolveKey(title),
  }
}
