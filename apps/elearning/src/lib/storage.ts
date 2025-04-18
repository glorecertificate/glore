import { Env } from '@/lib/env'

const DEFAULT_BUCKET = 'assets'

/**
 * Available remote assets.
 * Assets are retrieved from the `assets` bucket unless a path is specified.
 */
export enum Asset {
  AppleIcon = 'meta/apple-touch-icon.png',
  Favicon96 = 'meta/favicon-96x96.png',
  OpenGraph = 'meta/open-graph.png',
  WebManifest192 = 'meta/web-app-manifest-192x192.png',
  WebManifest512 = 'meta/web-app-manifest-512x512.png',
  Logo = 'logo.png',
  Trailer = 'trailer.mp4',
}

export const asset = (asset: Asset | `${Asset}`) =>
  `${Env.STORAGE_URL}/${asset.split('/').length === 1 ? `${DEFAULT_BUCKET}/` : '/'}${asset}`

/**
 * Available public assets.
 */
export enum Public {
  Favicon = '/favicon.ico',
  Manifest = '/manifest.webmanifest',
}

/**
 * Available application cookies.
 */
export enum Cookie {
  Locale = 'NEXT_LOCALE',
  Org = 'GLORE_ORG',
  SidebarOpen = 'GLORE_SIDEBAR_OPEN',
}
