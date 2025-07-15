import bundleAnalyzer from '@next/bundle-analyzer'
import { type NextConfig } from 'next'

import { Env } from '@/lib/env'

const tsconfigPath = Env.DEV ? 'tsconfig.json' : 'tsconfig.build.json'

const nextConfig: NextConfig = {
  experimental: {
    typedEnv: Env.DEV,
    useCache: true,
  },
  images: {
    remotePatterns: [new URL(Env.SUPABASE_URL)],
    unoptimized: Env.DEV,
  },
  reactStrictMode: true,
  typescript: { tsconfigPath },
}

const withBundleAnalyzer = bundleAnalyzer({ enabled: Env.ANALYZE })

export default withBundleAnalyzer(nextConfig)
