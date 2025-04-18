import { resolve } from 'node:path'

import bundleAnalyzer from '@next/bundle-analyzer'
import { type NextConfig } from 'next'

import createNextIntlPlugin from 'next-intl/plugin'
import type { PluginConfig as NextIntlConfig } from 'node_modules/next-intl/dist/types/plugin/types'

import { Env } from '@/lib/env'
import app from 'config/app.json'

const I18N_CONFIG = './src/middlewares/i18n.ts'
const MESSAGES_DECLARATION = resolve(`config/translations/${app.defaultLocale}.json`)

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: new URL(Env.SUPABASE_URL).hostname,
        protocol: 'https',
      },
    ],
  },
  reactStrictMode: true,
}

const nextIntlConfig: NextIntlConfig = {
  experimental: {
    createMessagesDeclaration: MESSAGES_DECLARATION,
  },
  requestConfig: I18N_CONFIG,
}

export default createNextIntlPlugin(nextIntlConfig)(
  bundleAnalyzer({
    enabled: Env.ANALYZE,
  })(nextConfig),
)
