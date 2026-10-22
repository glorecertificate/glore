import { type NextConfig } from 'next'
import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD, type PHASE_TYPE } from 'next/constants'

import nextIntl from 'next-intl/plugin'
import z from 'zod'

import { type dependencies } from './package.json'

type Dependency = keyof typeof dependencies

interface TypedNextConfig extends Omit<NextConfig, 'experimental' | 'serverExternalPackages'> {
  serverExternalPackages?: Dependency[]
  experimental?: NextConfig['experimental'] & {
    optimizePackageImports?: Dependency[]
  }
}

const envSchema = z.object({
  APP_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().regex(/^[A-Za-z0-9+/]{43}=$/u),
  CRON_SECRET: z.string().min(16).optional(),
  DATABASE_URL: z
    .string()
    .startsWith('postgresql://')
    .refine(
      url => url.includes('@localhost') || url.includes('@127.0.0.1') || url.includes('sslmode=require'),
      'DATABASE_URL must include sslmode=require or point at localhost'
    ),
  GEMINI_API_KEY: z.string().min(1).optional(),
  GEMINI_MODEL: z.string().min(1).optional(),
  MAIL_TRANSPORT: z.enum(['smtp', 'log', 'mailpit']).optional(),
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

if (!process.env.SKIP_ENV_VALIDATION) {
  envSchema.parse(process.env)
}

declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof envSchema> {}
  }
}

const hostname = URL.parse(process.env.R2_PUBLIC_URL ?? '')?.hostname
const remotePatterns = hostname ? [{ protocol: 'https', hostname } as const] : []

const nextConfig: TypedNextConfig = {
  agentRules: false,
  reactStrictMode: true,
  cacheComponents: true,
  partialPrefetching: true,
  trailingSlash: false,
  redirects: () => [
    {
      source: '/',
      destination: '/dashboard',
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
      source: '/api/v1/manifest',
      headers: [
        {
          key: 'cache-control',
          value: 'public, max-age=3600, s-maxage=3600',
        },
      ],
    },
  ],
  outputFileTracingIncludes: { '/**': ['./public/certificate/**', './public/fonts/roboto/**', './content/legal/**'] },
  serverExternalPackages: ['qrcode'],
  typedRoutes: true,
  images: { remotePatterns },
  experimental: {
    optimizePackageImports: [
      '@dnd-kit/core',
      '@dnd-kit/sortable',
      '@dnd-kit/utilities',
      'cmdk',
      'motion',
      'nuqs',
      'react-day-picker',
      'react-hook-form',
    ],
    turbopackFileSystemCacheForDev: false,
    turbopackFileSystemCacheForBuild: true,
  },
}

const createNextConfig = (phase: PHASE_TYPE) => {
  const isDevServer = phase === PHASE_DEVELOPMENT_SERVER
  const isProdBuild = phase === PHASE_PRODUCTION_BUILD
  const allowedDevOrigins = isDevServer ? [new URL(process.env.APP_URL).host] : undefined
  const tsconfigPath = isProdBuild ? 'tsconfig.build.json' : 'tsconfig.json'

  const plugins = [
    nextIntl({
      requestConfig: './src/i18n.ts',
      experimental: {
        messages: {
          path: './messages',
          locales: 'infer',
          format: 'json',
          precompile: !isDevServer,
        },
      },
    }),
  ]

  return plugins.reduce<NextConfig>((config, next) => next(config), {
    ...nextConfig,
    allowedDevOrigins,
    reactCompiler: !isDevServer,
    typescript: {
      ignoreBuildErrors: true,
      tsconfigPath,
    },
  })
}

export default createNextConfig
