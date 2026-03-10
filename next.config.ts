import { type NextConfig, Route } from 'next'

import nextIntl from 'next-intl/plugin'

const ROOT_REDIRECT: Route = '/dashboard'
const MANIFEST_PATH: Route = '/api/v1/manifest'
const MANIFEST_CACHE_MAX_AGE = 'public, max-age=3600'

const nextConfig = {
  reactStrictMode: true,
  cacheComponents: true,
  trailingSlash: false,
  headers: () => [
    {
      headers: [
        {
          key: 'cache-control',
          value: `public, max-age=${MANIFEST_CACHE_MAX_AGE}`,
        },
      ],
      source: MANIFEST_PATH,
    },
  ],
  redirects: () => [
    {
      source: '/',
      destination: ROOT_REDIRECT,
      permanent: true,
    },
  ],
  typedRoutes: true,
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
} satisfies NextConfig

const plugins = [
  nextIntl({
    experimental: {
      messages: {
        path: './messages',
        locales: 'infer',
        format: 'json',
        precompile: true,
      },
    },
    requestConfig: './src/i18n.ts',
  }),
]

export default plugins.reduce<NextConfig>((config, next) => next(config), nextConfig)
