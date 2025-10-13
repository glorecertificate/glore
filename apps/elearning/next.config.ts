import { type NextConfig } from 'next'

import bundleAnalyzer from '@next/bundle-analyzer'
import createNextIntlPlugin from 'next-intl/plugin'

const I18N_PATH = './src/lib/i18n.ts'
const MESSAGES_DECLARATION = '../../config/translations/en.json'

const isDev = process.env.NODE_ENV === 'development'
const analyze = process.env.ANALYZE === 'true'

const nextConfig: NextConfig = {
  experimental: {
    typedEnv: isDev,
  },
  images: {
    remotePatterns: [new URL(process.env.SUPABASE_URL)],
  },
  reactStrictMode: true,
  // transpilePackages: ['@glore/i18n', '@glore/mailer'],
  typescript: {
    tsconfigPath: isDev ? 'tsconfig.json' : 'tsconfig.build.json',
  },
}

const nextIntl = createNextIntlPlugin({
  requestConfig: I18N_PATH,
  experimental: {
    createMessagesDeclaration: MESSAGES_DECLARATION,
  },
})

export default bundleAnalyzer({ enabled: analyze })(nextIntl(nextConfig))
