import { type FileRouter, createUploadthing } from 'uploadthing/next'

import { type Enum } from '@glore/utils/types'

export enum PublicAsset {
  Robots = '/robots.txt',
  Manifest = '/api/manifest',
  Favicon = '/favicon.ico',
  Favicon96 = '/favicon-96x96.png',
  AppleIcon = '/apple-icon.png',
  WebAppIcon192 = '/web-app-icon-192x192.png',
  WebAppIcon512 = '/web-app-icon-512x512.png',
  WebAppScreenshotNarrow = '/web-app-screenshot-narrow.png',
  WebAppScreenshotWide = '/web-app-screenshot-wide.png',
  OpenGraph = '/open-graph.png',
}

export enum RemoteAsset {
  Logo = 'logo.png',
  Trailer = 'trailer.mp4',
}

export const uploader = {
  editorUploader: createUploadthing()(['image', 'text', 'blob', 'pdf', 'video', 'audio'])
    .middleware(() => ({}))
    .onUploadComplete(({ file }) => ({
      key: file.key,
      name: file.name,
      size: file.size,
      type: file.type,
      url: file.ufsUrl,
    })),
} satisfies FileRouter

export const assetUrl = (asset: Enum<RemoteAsset>) => `${process.env.STORAGE_URL}/assets/${asset}`
