import { Suspense } from 'react'

import { getTranslations } from 'next-intl/server'
import { createSearchParamsCache } from 'nuqs/server'

import { AuthFlow } from '@/components/features/auth/auth-flow'
import { authMetaTitleKey, defaultAuthView } from '@/components/features/auth/meta'
import { authParsers } from '@/components/features/auth/params'
import { LegalLinks } from '@/components/features/legal/legal-links'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { ThemeSwitch } from '@/components/ui/theme-switch'
import { cookies } from '@/lib/cookie-store'
import { appTitle } from '@/lib/metadata'

const { parse } = createSearchParamsCache(authParsers)

export const generateMetadata = async ({ searchParams }: PageProps<'/login'>) => {
  const [params, t] = await Promise.all([parse(searchParams), getTranslations('Auth')])
  return { title: { absolute: appTitle(t(authMetaTitleKey(defaultAuthView(params)))) } }
}

const LoginContent = async ({ searchParams }: { searchParams: PageProps<'/login'>['searchParams'] }) => {
  const { get } = await cookies()
  const [username, theme, params] = await Promise.all([get('loginUser'), get('theme'), parse(searchParams)])

  return (
    <AuthFlow
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2 pb-6">
          <LegalLinks />
          <ThemeSwitch className="text-sm" defaultTheme={theme} tooltip={{ showArrow: false, side: 'top' }} />
        </div>
      }
      params={params}
      username={username}
    />
  )
}

const LoginPage = ({ searchParams }: PageProps<'/login'>) => (
  <div className="min-h-svh bg-canvas">
    <Suspense fallback={<LoadingFallback size="full" />}>
      <LoginContent searchParams={searchParams} />
    </Suspense>
  </div>
)

export default LoginPage
