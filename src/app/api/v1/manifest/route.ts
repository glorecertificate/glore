import { type MetadataRoute } from 'next'
import { type NextRequest, NextResponse } from 'next/server'

import { type Locale } from 'next-intl'
import { getTranslations } from 'next-intl/server'

import { DEFAULT_LOCALE } from '@/lib/i18n'
import { publicFile } from '@/lib/utils'
import metadata from '~/config/metadata.json'

export const GET = async (request: NextRequest) => {
  const url = new URL(request.url)
  const locale = (url.searchParams.get('/locale') ?? DEFAULT_LOCALE) as Locale
  const t = await getTranslations({ locale, namespace: 'Metadata' })

  const manifest: MetadataRoute.Manifest = {
    background_color: metadata.themeColor,
    description: t('pwaDescription'),
    display: 'standalone',
    icons: [
      {
        purpose: 'any',
        sizes: '192x192',
        src: publicFile('/web-app-icon-192x192.png'),
        type: 'image/png',
      },
      {
        purpose: 'any',
        sizes: '512x512',
        src: publicFile('/web-app-icon-512x512.png'),
        type: 'image/png',
      },
    ],
    name: metadata.name,
    screenshots: [
      {
        form_factor: 'wide',
        src: publicFile('/web-app-screenshot-wide.png'),
        sizes: '1280x720',
        type: 'image/png',
        label: metadata.name,
      },
      {
        form_factor: 'narrow',
        src: publicFile('/web-app-screenshot-narrow.png'),
        sizes: '720x1280',
        type: 'image/png',
        label: metadata.name,
      },
    ],
    short_name: metadata.shortName,
    start_url: '/',
    theme_color: metadata.themeColor,
  }

  return NextResponse.json<MetadataRoute.Manifest>(manifest, { status: 200 })
}
