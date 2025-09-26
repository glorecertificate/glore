'use client'

import app from '@config/app'
import metadata from '@config/metadata'
import theme from '@config/theme'

const config = { app, metadata, theme } as const

/**
 * Hook exposing the application configuration.
 */
export const useConfig = <T extends keyof typeof config>(namespace?: T) =>
  (namespace ? config[namespace] : config) as T extends keyof typeof config ? (typeof config)[T] : typeof config
