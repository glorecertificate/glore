import { Suspense } from 'react'

import { getTranslations } from 'next-intl/server'
import { createSearchParamsCache } from 'nuqs/server'

import { AuthFlow } from '@/components/features/auth/auth-flow'
import { authMetaTitleKey, defaultAuthView } from '@/components/features/auth/meta'
import { authParsers } from '@/components/features/auth/params'
import { LegalLinks } from '@/components/features/legal/legal-links'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { MessagesScope } from '@/components/providers/messages-scope'
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
      <div className="mx-auto flex w-full max-w-md items-center justify-between gap-4 px-4 pb-6">
        <LegalLinks />
        <ThemeSwitch className="text-sm" defaultTheme={theme} tooltip={{ showArrow: false, side: 'top' }} />
      </div>
    </>
  )
}

const LoginPage = ({ searchParams }: PageProps<'/login'>) => (
  <div className="flex min-h-svh flex-col bg-canvas">
    <Suspense fallback={<LoadingFallback size="full" />}>
      <MessagesScope scope="login">
        <LoginContent searchParams={searchParams} />
      </MessagesScope>
    </Suspense>
  </div>
)

export default LoginPage
