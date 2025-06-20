import { Env } from '@/lib/env'

/**
 * Application cookie names.
 */
export enum Cookie {
  Locale = 'NEXT_LOCALE',
  Org = 'glore.current-org',
  SidebarOpen = 'glore.sidebar-state',
}

/**
 * Application local storage keys.
 */
export enum LocalStorage {
  SupabaseWidgetPosition = 'glore.supabase-widget',
}

/**
 * Public assets used in the application.
 */
export enum Public {
  Favicon = '/favicon.ico',
  Manifest = '/manifest.webmanifest',
}

/**
 * Paths to remote assets relative to the main storage URL.
 */
export enum Asset {
  Logo = 'assets/logo.png',
  Trailer = 'assets/trailer.mp4',
  AppleIcon = 'metadata/apple-touch-icon.png',
  Favicon96 = 'metadata/favicon-96x96.png',
  OpenGraph = 'metadata/open-graph.png',
  WebManifest192 = 'metadata/web-app-manifest-192x192.png',
  WebManifest512 = 'metadata/web-app-manifest-512x512.png',
}

/**
 * Generates a URL for an asset based on the environment's storage.
 */
export const asset = (asset: Asset | `${Asset}`) => `${Env.STORAGE_URL}/${asset}`
