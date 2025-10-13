import { type Enum } from '@glore/utils/types'

export enum PublicAsset {
  Robots = 'robots.txt',
  Favicon = 'favicon.ico',
  Favicon96 = 'favicon-96x96.png',
  AppleIcon = 'apple-icon.png',
  WebAppIcon192 = 'web-app-icon-192x192.png',
  WebAppIcon512 = 'web-app-icon-512x512.png',
  WebAppScreenshotNarrow = 'web-app-screenshot-narrow.png',
  WebAppScreenshotWide = 'web-app-screenshot-wide.png',
  OpenGraph = 'open-graph.png',
}

export enum RemoteAsset {
  EmailLogo = 'email/logo.png',
}

export const publicAsset = (path: Enum<PublicAsset>) => `/${path}`

export const assetUrl = (path: Enum<RemoteAsset>) => `${process.env.STORAGE_URL}/${path}`
