import { type NextConfig, Route } from 'next'
import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD, type PHASE_TYPE } from 'next/constants'

import nextIntl from 'next-intl/plugin'

import { type dependencies } from './package.json'
import { schema } from './src/lib/env'

type PackageName = keyof typeof dependencies

const ROOT_REDIRECT: Route = '/dashboard'
const MANIFEST_PATH: Route = '/api/v1/manifest'

const config = {
  reactStrictMode: true,
  reactCompiler: true,
  cacheComponents: true,
  trailingSlash: false,
  redirects: () => [
    {
      source: '/',
      destination: ROOT_REDIRECT,
      permanent: true,
    },
  ],
  headers: () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob: https:",
            "font-src 'self' data:",
            "connect-src 'self' https:",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "object-src 'none'",
            "worker-src 'self' blob:",
          ].join('; '),
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
      ],
    },
    {
      source: MANIFEST_PATH,
      headers: [
        {
          key: 'cache-control',
          value: 'public, max-age=3600, s-maxage=3600',
        },
      ],
    },
  ],
  serverExternalPackages: ['qrcode'] satisfies PackageName[],
  typedRoutes: true,
  logging: {
    fetches: {
      fullUrl: true,
      hmrRefreshes: true,
    },
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
  if ((phase === PHASE_DEVELOPMENT_SERVER || phase === PHASE_PRODUCTION_BUILD) && !process.env.SKIP_ENV_VALIDATION) {
    schema.parse(process.env)
  }
  return plugins.reduce<NextConfig>((acc, next) => next(acc), config)
}
