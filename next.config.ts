import { type NextConfig, Route } from 'next'
import { PHASE_DEVELOPMENT_SERVER, type PHASE_TYPE } from 'next/constants'

import nextIntl from 'next-intl/plugin'
import z from 'zod'

import { type dependencies } from './package.json'

const envSchema = z.object({
  APP_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().regex(/^[A-Za-z0-9+/]{43}=$/u),
  DATABASE_URL: z
    .string()
    .startsWith('postgresql://')
    .refine(
      url => url.includes('@localhost') || url.includes('@127.0.0.1') || url.includes('sslmode=require'),
      'DATABASE_URL must include sslmode=require (Neon) or point at localhost (local Postgres)'
    ),
  GEMINI_API_KEY: z.string().min(1).optional(),
  GEMINI_MODEL: z.string().min(1).optional(),
  R2_ACCOUNT_ID: z.string().regex(/^[0-9a-f]{32}$/u),
  R2_ACCESS_KEY_ID: z.string().regex(/^[0-9a-f]{32}$/u),
  R2_SECRET_ACCESS_KEY: z.string().regex(/^[0-9a-f]{64}$/u),
  R2_BUCKET_NAME: z.string().regex(/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/u),
  R2_PUBLIC_URL: z.url(),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.enum(['25', '465', '587']),
  SMTP_SENDER: z.string().min(1),
  SMTP_USER: z.email(),
  SMTP_PASSWORD: z.string().min(1),
})

if (!process.env.SKIP_ENV_VALIDATION) envSchema.parse(process.env)

declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof envSchema> {}
  }
}

type Package = keyof typeof dependencies

const ROOT_REDIRECT: Route = '/dashboard'
const MANIFEST_SOURCE: Route = '/api/v1/manifest'
const EXTERNAL_PACKAGES: Package[] = ['qrcode']

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
      source: MANIFEST_SOURCE,
      headers: [
        {
          key: 'cache-control',
          value: 'public, max-age=3600, s-maxage=3600',
        },
      ],
    },
  ],
  serverExternalPackages: EXTERNAL_PACKAGES,
  typedRoutes: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    turbopackFileSystemCacheForDev: true,
    turbopackFileSystemCacheForBuild: true,
  },
}

export default (phase: PHASE_TYPE) => {
  const isDevelopment = phase === PHASE_DEVELOPMENT_SERVER

  const plugins = [
    nextIntl({
      experimental: {
        messages: {
          path: './messages',
          locales: 'infer',
          format: 'json',
          precompile: !isDevelopment,
        },
      },
      requestConfig: './src/i18n.ts',
    }),
  ]

  return plugins.reduce<NextConfig>((config, next) => next(config), {
    ...nextConfig,
    reactCompiler: !isDevelopment,
  })
}
