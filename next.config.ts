import '@next/env'

import { type NextConfig } from 'next'
import { PHASE_PRODUCTION_BUILD, type PHASE_TYPE } from 'next/constants'

import nextIntl from 'next-intl/plugin'

export default (phase: PHASE_TYPE, { defaultConfig }: { defaultConfig: NextConfig }) => {
  const tsconfigPath = phase === PHASE_PRODUCTION_BUILD ? 'tsconfig.build.json' : 'tsconfig.json'

  const nextConfig = {
    ...defaultConfig,
    reactStrictMode: true,
    cacheComponents: true,
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
      remotePatterns: [new URL(process.env.NEXT_PUBLIC_STORAGE_URL)],
    },
    typescript: {
      tsconfigPath,
    },
    typedRoutes: true,
    experimental: {
      turbopackFileSystemCacheForDev: true,
    },
  } satisfies NextConfig

  const plugins = [
    nextIntl({
      requestConfig: './src/middleware/i18n.ts',
      experimental: {
        createMessagesDeclaration: './config/translations/en.json',
      },
    }),
  ]

  return plugins.reduce<NextConfig>((config, next) => next(config), nextConfig)
}
