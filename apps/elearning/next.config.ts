import bundleAnalyzer from '@next/bundle-analyzer'
import { type NextConfig } from 'next'

import { next } from 'million/compiler'
import nextIntl from 'next-intl/plugin'
import type { PluginConfig as NextIntlConfig } from 'node_modules/next-intl/dist/types/plugin/types'

import { Env } from '@/lib/env'
import app from 'config/app.json'

type BundleAnalyzerConfig = Parameters<typeof bundleAnalyzer>[0]
type MillionConfig = Parameters<typeof next>[1]
type NextConfigMillion = Parameters<typeof next>[0]

const I18N_PATH = './src/middlewares/locale.ts'
const MESSAGES_PATH = `./config/translations/${app.defaultLocale}.json`
const tsconfigPath = Env.isProduction ? 'tsconfig.build.json' : 'tsconfig.json'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: new URL(Env.SUPABASE_URL).hostname,
        protocol: 'https',
      },
    ],
  },
  reactStrictMode: true,
  typescript: {
    tsconfigPath,
  },
}

const bundleAnalyzerConfig: BundleAnalyzerConfig = {
  enabled: Env.isAnalyze,
}

const nextIntlConfig: NextIntlConfig = {
  experimental: {
    createMessagesDeclaration: MESSAGES_PATH,
  },
  requestConfig: I18N_PATH,
}

const millionConfig: MillionConfig = {
  auto: true,
  log: false,
  rsc: true,
  telemetry: false,
}

const withBundleAnalyzer = bundleAnalyzer(bundleAnalyzerConfig)(nextConfig)
const withNextIntl = nextIntl(nextIntlConfig)(withBundleAnalyzer)

export default next(withNextIntl as NextConfigMillion, millionConfig)
