import { type NextConfig, Route } from 'next'
import { PHASE_DEVELOPMENT_SERVER, type PHASE_TYPE } from 'next/constants'

import nextIntl from 'next-intl/plugin'

import { validateEnv } from './src/lib/env'

const ROOT_REDIRECT: Route = '/dashboard'
const MANIFEST_PATH: Route = '/api/v1/manifest'
const MANIFEST_CACHE_MAX_AGE = 'public, max-age=3600'

const AWS_SDK_PKGS = ['./node_modules/@aws-sdk/**/*']
const HEAVY_PKGS = [...AWS_SDK_PKGS, './node_modules/@react-pdf/**/*']

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
  outputFileTracingExcludes: {
    '/login': HEAVY_PKGS,
    '/register': HEAVY_PKGS,
    '/onboarding': HEAVY_PKGS,
    '/onboarding/error': HEAVY_PKGS,
    '/dashboard': HEAVY_PKGS,
    '/about': HEAVY_PKGS,
    '/help': HEAVY_PKGS,
    '/docs': HEAVY_PKGS,
    '/docs/faq': HEAVY_PKGS,
    '/docs/intro': HEAVY_PKGS,
    '/docs/tutorials': HEAVY_PKGS,
    '/courses': HEAVY_PKGS,
    '/courses/[slug]': HEAVY_PKGS,
    '/admin': HEAVY_PKGS,
    '/admin/users': HEAVY_PKGS,
    '/admin/organizations': HEAVY_PKGS,
    '/settings': AWS_SDK_PKGS,
    '/organization': AWS_SDK_PKGS,
    '/api/auth/[...all]': HEAVY_PKGS,
    '/api/v1/ai/command': HEAVY_PKGS,
    '/api/v1/ai/copilot': HEAVY_PKGS,
    '/api/v1/join': HEAVY_PKGS,
    '/api/v1/manifest': HEAVY_PKGS,
  },
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
      'fuse.js',
      'lucide-react',
      'motion',
      'next-intl',
      'nuqs',
      'platejs',
      'sonner',
    ],
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
    turbopackFileSystemCacheForDev: true,
    webpackBuildWorker: true,
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
