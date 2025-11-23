import { type NextConfig } from 'next'
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants'

import bundleAnalyzer from '@next/bundle-analyzer'
import nextIntl from 'next-intl/plugin'

const INTL_MESSAGES = './config/translations/en.json'
const INTL_REQUEST_CONFIG = './src/i18n.ts'

export default (phase: string, { defaultConfig }: { defaultConfig: NextConfig }) => {
  const nextConfig = {
    ...defaultConfig,
    experimental: {
      turbopackFileSystemCacheForDev: true,
    },
    headers: () => [
      {
        headers: [
          {
            key: 'cache-control',
            value: 'public, max-age=3600',
          },
        ],
        source: '/api/manifest',
      },
    ],
    images: {
      remotePatterns: [new URL(process.env.SUPABASE_URL)],
    },
    reactStrictMode: true,
    trailingSlash: false,
    typedRoutes: true,
    typescript: {
      tsconfigPath: phase === PHASE_DEVELOPMENT_SERVER ? 'tsconfig.json' : 'tsconfig.build.json',
    },
  } satisfies NextConfig

  const plugins = [
    bundleAnalyzer({
      enabled: process.env.ANALYZE === 'true',
    }),
    nextIntl({
      requestConfig: INTL_REQUEST_CONFIG,
      experimental: {
        createMessagesDeclaration: INTL_MESSAGES,
      },
    }),
  ]

  return plugins.reduce<NextConfig>((config, next) => next(config), nextConfig)
}
