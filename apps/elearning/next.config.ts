import bundleAnalyzer from '@next/bundle-analyzer'
import { type NextConfig } from 'next'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

const isDev = process.env.NODE_ENV === 'development'
const analyze = process.env.ANALYZE === 'true'
const tsconfigPath = isDev ? 'tsconfig.json' : 'tsconfig.build.json'

const nextConfig: NextConfig = {
  experimental: {
    typedEnv: isDev,
    useCache: true,
  },
  images: {
    remotePatterns: [new URL(SUPABASE_URL)],
    unoptimized: isDev,
  },
  reactStrictMode: true,
  typescript: { tsconfigPath },
}

const withBundleAnalyzer = bundleAnalyzer({ enabled: analyze })

export default withBundleAnalyzer(nextConfig)
