import { type MetadataRoute } from 'next'

import app from 'config/app.json'

export default () =>
  ({
    name: app.title,
    short_name: app.title,
    description: app.description,
    start_url: '/',
    lang: app.locale,
    background_color: app.themeColor,
    theme_color: app.themeColor,
    display: 'standalone',
    icons: [
      {
        purpose: 'maskable',
        sizes: '192x192',
        src: '/web-app-manifest-192x192.png',
        type: 'image/png',
      },
      {
        purpose: 'maskable',
        sizes: '512x512',
        src: '/web-app-manifest-512x512.png',
        type: 'image/png',
      },
    ],
  }) satisfies MetadataRoute.Manifest
