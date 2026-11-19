import { Suspense } from 'react'

import { getTranslations } from 'next-intl/server'
import { createSearchParamsCache } from 'nuqs/server'

import { AuthBand } from '@/components/features/auth/auth-band'
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
    <>
      <AuthFlow params={params} username={username} />
      <footer className="flex items-center justify-between gap-4 px-page py-5">
        <LegalLinks />
        <ThemeSwitch className="text-sm" defaultTheme={theme} tooltip={{ showArrow: false, side: 'top' }} />
      </footer>
    </>
  )
}

const LoginPage = ({ searchParams }: PageProps<'/login'>) => (
  <div className="flex min-h-svh flex-col bg-canvas">
    <AuthBand />
    <Suspense fallback={<LoadingFallback className="flex-1" />}>
      <LoginContent searchParams={searchParams} />
    </Suspense>
  </div>
)

export default LoginPage
