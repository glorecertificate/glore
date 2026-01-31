import { type MetadataRoute } from 'next'
import { type NextRequest, NextResponse } from 'next/server'

import { type Locale } from 'next-intl'
import { getTranslations } from 'next-intl/server'

import metadata from '~/config/metadata.json'

import { i18n } from '@/lib/i18n'
import { publicFile } from '@/lib/storage'

export const GET = async (request: NextRequest) => {
  const url = new URL(request.url)
  const locale = (url.searchParams.get('/locale') ?? i18n.defaultLocale) as Locale
  const t = await getTranslations({ namespace: 'Metadata', locale })

  const manifest: MetadataRoute.Manifest = {
    name: metadata.name,
    short_name: metadata.shortName,
    description: t('pwaDescription'),
    start_url: '/',
    background_color: metadata.themeColor,
    theme_color: metadata.themeColor,
    display: 'standalone',
    icons: [
      {
        purpose: 'any',
        sizes: '192x192',
        src: publicFile('/assets/certificate.svg'),
        type: 'image/png',
      },
      {
        purpose: 'any',
        sizes: '512x512',
        src: publicFile('/web-app-icon-512x512.png'),
        type: 'image/png',
      },
    ],
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
  }

  return NextResponse.json<MetadataRoute.Manifest>(manifest, { status: 200 })
}
