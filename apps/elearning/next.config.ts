import { resolve } from 'node:path'

import bundleAnalyzer from '@next/bundle-analyzer'
import { type NextConfig } from 'next'

import createNextIntlPlugin from 'next-intl/plugin'
import type { PluginConfig as NextIntlConfig } from 'node_modules/next-intl/dist/types/plugin/types'

import { Env } from '@/lib/env'
import app from 'config/app.json'

const I18N_MIDDLEWARE = './src/middlewares/i18n.ts'
const MESSAGE_DECLARATIONS = resolve(`config/translations/${app.defaultLocale}.json`)

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
    createMessagesDeclaration: MESSAGE_DECLARATIONS,
  },
  requestConfig: I18N_MIDDLEWARE,
}

export default createNextIntlPlugin(nextIntlConfig)(
  bundleAnalyzer({
    enabled: Env.ANALYZE,
  })(nextConfig),
)
