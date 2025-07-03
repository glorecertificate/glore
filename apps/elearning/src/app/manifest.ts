import { type MetadataRoute } from 'next'

import { asset, Asset } from '@/lib/storage'
import metadata from 'config/metadata.json'

export default (): MetadataRoute.Manifest => ({
  name: metadata.title,
  short_name: metadata.name,
  description: metadata.pwaDescription,
  start_url: '/',
  background_color: metadata.themeColor,
  theme_color: metadata.themeColor,
  display: 'standalone',
  icons: [
    {
      purpose: 'any',
      sizes: '192x192',
      src: asset(Asset.WebAppIcon192),
      type: 'image/png',
    },
    {
      purpose: 'any',
      sizes: '512x512',
      src: asset(Asset.WebAppIcon512),
      type: 'image/png',
    },
  ],
  screenshots: [
    {
      form_factor: 'wide',
      src: asset(Asset.WebAppScreenshotWide),
      sizes: '1280x720',
      type: 'image/png',
      label: metadata.name,
    },
    {
      form_factor: 'narrow',
      src: asset(Asset.WebAppScreenshotNarrow),
      sizes: '720x1280',
      type: 'image/png',
      label: metadata.name,
    },
  ],
})
