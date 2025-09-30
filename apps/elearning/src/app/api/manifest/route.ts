import { type MetadataRoute } from 'next'

import metadata from '@config/metadata'
import { i18n, type Locale } from '@glore/i18n'

import { PublicAsset } from '@/lib/assets'
import { getTranslations } from '@/lib/i18n'
import { NextResponse } from 'next/server'

export const GET = async (request: Request) => {
  const url = new URL(request.url)
  const locale = (url.searchParams.get('locale') ?? i18n.defaultLocale) as Locale
  const t = await getTranslations('App', { locale })

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
        src: PublicAsset.WebAppIcon192,
        type: 'image/png',
      },
      {
        purpose: 'any',
        sizes: '512x512',
        src: PublicAsset.WebAppIcon512,
        type: 'image/png',
      },
    ],
    screenshots: [
      {
        form_factor: 'wide',
        src: PublicAsset.WebAppScreenshotWide,
        sizes: '1280x720',
        type: 'image/png',
        label: metadata.name,
      },
      {
        form_factor: 'narrow',
        src: PublicAsset.WebAppScreenshotNarrow,
        sizes: '720x1280',
        type: 'image/png',
        label: metadata.name,
      },
    ],
  }

  return NextResponse.json<MetadataRoute.Manifest>(manifest, { status: 200 })
}
