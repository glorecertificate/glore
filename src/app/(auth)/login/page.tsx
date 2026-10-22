import { Suspense } from 'react'

import { getTranslations } from 'next-intl/server'
import { createSearchParamsCache } from 'nuqs/server'

import { cookies } from '@/actions/cookies'
import { AuthFlow } from '@/components/features/auth/auth-flow'
import { authMetaTitleKey, defaultAuthView } from '@/components/features/auth/meta'
import { authParsers } from '@/components/features/auth/params'
import { LegalLinks } from '@/components/features/legal/legal-links'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { ThemeSwitch } from '@/components/ui/theme-switch'
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
      <div className="flex items-center justify-between gap-4">
        <LegalLinks />
        <ThemeSwitch className="text-sm" defaultTheme={theme} tooltip={{ showArrow: false, side: 'top' }} />
      </div>
    </>
  )
}

const LoginPage = ({ searchParams }: PageProps<'/login'>) => (
  <div className="flex h-full min-h-screen flex-col gap-4 p-6 md:p-10">
    <Suspense fallback={<LoadingFallback size="full" />}>
      <LoginContent searchParams={searchParams} />
    </Suspense>
  </div>
)

export default LoginPage
