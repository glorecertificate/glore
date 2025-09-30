import '@glore/env'

import bundleAnalyzer from '@next/bundle-analyzer'
import { type NextConfig } from 'next'

const SUPABASE_URL = process.env.SUPABASE_URL

const isDev = process.env.NODE_ENV === 'development'
const analyze = process.env.ANALYZE === 'true'
const tsconfigPath = isDev ? 'tsconfig.json' : 'tsconfig.build.json'
const remotePatterns = SUPABASE_URL ? [new URL(SUPABASE_URL)] : []

const nextConfig: NextConfig = {
  experimental: {
    typedEnv: isDev,
    useCache: true,
  },
  images: {
    remotePatterns,
    unoptimized: isDev,
  },
  reactStrictMode: true,
  transpilePackages: ['@glore/i18n', '@glore/ui'],
  typescript: {
    tsconfigPath,
  },
}

export default bundleAnalyzer({ enabled: analyze })(nextConfig)
