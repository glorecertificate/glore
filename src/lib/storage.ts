import { type Enum } from '@/lib/types'

export enum PublicAsset {
  Robots = 'robots.txt',
  Favicon = 'favicon.ico',
  Favicon96 = 'favicon-96x96.png',
  AppleIcon = 'apple-icon.png',
  WebAppIcon192 = 'web-app-icon-192x192.png',
  WebAppIcon512 = 'web-app-icon-512x512.png',
  WebAppScreenshotNarrow = 'web-app-screenshot-narrow.png',
  WebAppScreenshotWide = 'web-app-screenshot-wide.png',
  OpenGraphImage = 'og-image.png',
}

export enum StorageAsset {
  EmailLogo = 'email/logo.png',
}

export const publicAsset = (path: Enum<PublicAsset>) => `/${path}`

export const storageAsset = (path: Enum<StorageAsset>) => `${process.env.NEXT_PUBLIC_STORAGE_URL}/${path}`
