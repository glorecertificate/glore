import type { NextConfig } from 'next'
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants'

import bundleAnalyzer from '@next/bundle-analyzer'
import nextIntl from 'next-intl/plugin'

export default (phase: string, { defaultConfig }: { defaultConfig: NextConfig }) => {
  const tsconfigPath = phase === PHASE_DEVELOPMENT_SERVER ? 'tsconfig.json' : 'tsconfig.build.json'

  const nextConfig = {
    ...defaultConfig,
    cacheComponents: true,
    reactStrictMode: true,
    headers: () => [
      {
        headers: [
          {
            key: 'cache-control',
            value: 'public, max-age=3600',
          },
        ],
        source: '/api/v1/manifest',
      },
    ],
    images: {
      remotePatterns: [new URL(process.env.STORAGE_URL)],
    },
    typescript: {
      tsconfigPath,
    },
    typedRoutes: true,
  } satisfies NextConfig

  const plugins = [
    bundleAnalyzer({
      enabled: process.env.ANALYZE === 'true',
    }),
    nextIntl({
      requestConfig: './src/middleware/i18n.ts',
      experimental: {
        createMessagesDeclaration: './static/translations/en.json',
      },
    }),
  ]

  return plugins.reduce<NextConfig>((config, next) => next(config), nextConfig)
}
