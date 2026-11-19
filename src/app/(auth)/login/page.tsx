import { Suspense } from 'react'

import { getTranslations } from 'next-intl/server'
import { createSearchParamsCache } from 'nuqs/server'

import { AuthFlow } from '@/components/features/auth/auth-flow'
import { AuthFrame } from '@/components/features/auth/auth-frame'
import { AuthHero } from '@/components/features/auth/auth-hero'
import { authMetaTitleKey, defaultAuthView } from '@/components/features/auth/meta'
import { authParsers } from '@/components/features/auth/params'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { cookies } from '@/lib/cookie-store'
import { appTitle } from '@/lib/metadata'

const { parse } = createSearchParamsCache(authParsers)

export const generateMetadata = async ({ searchParams }: PageProps<'/login'>) => {
  const [params, t] = await Promise.all([parse(searchParams), getTranslations('Auth')])
  return { title: { absolute: appTitle(t(authMetaTitleKey(defaultAuthView(params)))) } }
}

const LoginContent = async ({ searchParams }: { searchParams: PageProps<'/login'>['searchParams'] }) => {
  const { get } = await cookies()
  const [username, params] = await Promise.all([get('loginUser'), parse(searchParams)])

  return <AuthFlow params={params} username={username} />
}

const LoginPage = ({ searchParams }: PageProps<'/login'>) => (
  <AuthFrame panel={<AuthHero />} variant="hero">
    <Suspense fallback={<LoadingFallback />}>
      <LoginContent searchParams={searchParams} />
    </Suspense>
  </AuthFrame>
)

export default LoginPage
