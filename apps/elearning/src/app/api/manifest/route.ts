import { type MetadataRoute } from 'next'

import metadata from '@config/metadata'
import { i18n, type Locale } from '@repo/i18n'

import { getTranslations } from '@/lib/i18n'
import { Public } from '@/lib/storage'

export const GET = async (request: Request) => {
  const url = new URL(request.url)
  const locale = (url.searchParams.get('locale') ?? i18n.defaultLocale) as Locale
  const t = await getTranslations('App', { locale })

  const manifest: MetadataRoute.Manifest = {
    name: metadata.title,
    short_name: metadata.name,
    description: t('pwaDescription'),
    start_url: '/',
    background_color: metadata.themeColor,
    theme_color: metadata.themeColor,
    display: 'standalone',
    icons: [
      {
        purpose: 'any',
        sizes: '192x192',
        src: Public.WebAppIcon192,
        type: 'image/png',
      },
      {
        purpose: 'any',
        sizes: '512x512',
        src: Public.WebAppIcon512,
        type: 'image/png',
      },
    ],
    screenshots: [
      {
        form_factor: 'wide',
        src: Public.WebAppScreenshotWide,
        sizes: '1280x720',
        type: 'image/png',
        label: metadata.name,
      },
      {
        form_factor: 'narrow',
        src: Public.WebAppScreenshotNarrow,
        sizes: '720x1280',
        type: 'image/png',
        label: metadata.name,
      },
    ],
  }

  return new Response(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
