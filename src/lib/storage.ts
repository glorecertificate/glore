import { type Enum } from '@/lib/types'

export enum PublicAsset {
  AppleIcon = '/apple-icon.png',
  Favicon = '/favicon.ico',
  Favicon96 = '/favicon-96x96.png',
  OpenGraphImage = '/og-image.png',
  Robots = '/robots.txt',
  WebAppIcon192 = '/web-app-icon-192x192.png',
  WebAppIcon512 = '/web-app-icon-512x512.png',
  WebAppScreenshotNarrow = '/web-app-screenshot-narrow.png',
  WebAppScreenshotWide = '/web-app-screenshot-wide.png',
}

export enum StorageAsset {
  EmailLogo = 'email/logo.png',
}

export const storageAsset = (path: Enum<StorageAsset>) => `${process.env.NEXT_PUBLIC_STORAGE_URL}/${path}`
