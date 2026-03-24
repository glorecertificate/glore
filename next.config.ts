import { type NextConfig, Route } from 'next'
import { PHASE_DEVELOPMENT_SERVER, type PHASE_TYPE } from 'next/constants'

import nextIntl from 'next-intl/plugin'

import { validateEnv } from './src/lib/env'

const ROOT_REDIRECT: Route = '/dashboard'
const MANIFEST_PATH: Route = '/api/v1/manifest'
const MANIFEST_CACHE_MAX_AGE = 'public, max-age=3600'

const AWS_SDKS = ['./node_modules/@aws-sdk/**/*']
const OPTIMIZED_PKGS = [...AWS_SDKS, './node_modules/@react-pdf/**/*']

const nextConfig = {
  reactStrictMode: true,
  reactCompiler: true,
  cacheComponents: true,
  trailingSlash: false,
  headers: () => [
    {
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload',
        },
      ],
      source: '/(.*)',
    },
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
    '/login': OPTIMIZED_PKGS,
    '/register': OPTIMIZED_PKGS,
    '/onboarding': OPTIMIZED_PKGS,
    '/onboarding/error': OPTIMIZED_PKGS,
    '/dashboard': OPTIMIZED_PKGS,
    '/about': OPTIMIZED_PKGS,
    '/help': OPTIMIZED_PKGS,
    '/docs': OPTIMIZED_PKGS,
    '/docs/faq': OPTIMIZED_PKGS,
    '/docs/intro': OPTIMIZED_PKGS,
    '/docs/tutorials': OPTIMIZED_PKGS,
    '/courses': OPTIMIZED_PKGS,
    '/courses/[slug]': OPTIMIZED_PKGS,
    '/admin': OPTIMIZED_PKGS,
    '/admin/users': OPTIMIZED_PKGS,
    '/admin/organizations': OPTIMIZED_PKGS,
    '/settings': AWS_SDKS,
    '/organization': AWS_SDKS,
    '/api/auth/[...all]': OPTIMIZED_PKGS,
    '/api/v1/ai/command': OPTIMIZED_PKGS,
    '/api/v1/ai/copilot': OPTIMIZED_PKGS,
    '/api/v1/join': OPTIMIZED_PKGS,
    '/api/v1/manifest': OPTIMIZED_PKGS,
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
