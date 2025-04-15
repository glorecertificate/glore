import { type MetadataRoute } from 'next'

import { asset } from '@/lib/storage'
import metadata from 'config/metadata.json'

export default () =>
  ({
    name: metadata.title,
    short_name: metadata.title,
    description: metadata.description,
    start_url: '/',
    background_color: metadata.themeColor,
    theme_color: metadata.themeColor,
    display: 'standalone',
    icons: [
      {
        purpose: 'maskable',
        sizes: '192x192',
        src: asset('meta/web-app-manifest-192x192.png'),
        type: 'image/png',
      },
      {
        purpose: 'maskable',
        sizes: '512x512',
        src: asset('meta/web-app-manifest-512x512.png'),
        type: 'image/png',
      },
    ],
  }) satisfies MetadataRoute.Manifest
