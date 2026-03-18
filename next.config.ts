import { type NextConfig, Route } from 'next'
import { PHASE_DEVELOPMENT_SERVER, type PHASE_TYPE } from 'next/constants'

import nextIntl from 'next-intl/plugin'

import { validateEnv } from './src/lib/env'

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
  typescript: {
    tsconfigPath: './tsconfig.build.json',
  },
  typedRoutes: true,
  experimental: {
    optimizePackageImports: [
      '@ai-sdk/openai',
      '@ai-sdk/react',
      '@dnd-kit/core',
      '@dnd-kit/modifiers',
      '@dnd-kit/sortable',
      '@dnd-kit/utilities',
      '@platejs/ai',
      '@platejs/autoformat',
      '@platejs/basic-nodes',
      '@platejs/basic-styles',
      '@platejs/callout',
      '@platejs/caption',
      '@platejs/combobox',
      '@platejs/date',
      '@platejs/dnd',
      '@platejs/emoji',
      '@platejs/floating',
      '@platejs/indent',
      '@platejs/juice',
      '@platejs/layout',
      '@platejs/link',
      '@platejs/list',
      '@platejs/markdown',
      '@platejs/media',
      '@platejs/resizable',
      '@platejs/selection',
      '@platejs/slash-command',
      '@platejs/table',
      '@platejs/toc',
      '@platejs/toggle',
      'better-auth',
      'motion',
      'platejs',
    ],
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
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

export default (phase: PHASE_TYPE) => {
  if (phase === PHASE_DEVELOPMENT_SERVER) {
    validateEnv()
  }
  return plugins.reduce<NextConfig>((config, next) => next(config), nextConfig)
}
