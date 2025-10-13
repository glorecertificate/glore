import { type NextConfig } from 'next'
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants'

import bundleAnalyzer from '@next/bundle-analyzer'
import nextIntl from 'next-intl/plugin'

const I18N_CONFIG = './src/i18n.ts'
const I18N_MESSAGES = '../../config/translations/en.json'

export default (phase: string, { defaultConfig }: { defaultConfig: NextConfig }) => {
  const nextConfig: NextConfig = {
    ...defaultConfig,
    cacheComponents: true,
    experimental: {
      turbopackFileSystemCacheForDev: true,
    },
    images: {
      remotePatterns: [new URL(process.env.SUPABASE_URL)],
    },
    reactStrictMode: true,
    trailingSlash: false,
    typedRoutes: true,
    typescript: {
      tsconfigPath: phase === PHASE_DEVELOPMENT_SERVER ? 'tsconfig.json' : 'tsconfig.build.json',
    },
    webpack: (config, { isServer }) => ({
      ...config,
      infrastructureLogging: {
        level: isServer ? 'info' : 'warn',
      },
    }),
  }

  const plugins = [
    bundleAnalyzer({
      enabled: process.env.ANALYZE === 'true',
    }),
    nextIntl({
      requestConfig: I18N_CONFIG,
      experimental: {
        createMessagesDeclaration: I18N_MESSAGES,
      },
    }),
  ]

  return plugins.reduce<NextConfig>((config, next) => next(config), nextConfig)
}
