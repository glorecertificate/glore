import { Suspense } from 'react'

import { createSearchParamsCache, parseAsString } from 'nuqs/server'

import { cookies } from '@/actions/cookies'
import { AuthFlow, type AuthView } from '@/components/features/auth/auth-flow'
import { ThemeSwitch } from '@/components/ui/theme-switch'
import { intlMetadata } from '@/lib/metadata'
import { type Enum } from '@/lib/types'
import { camelize } from '@/lib/utils'

const TOKEN_HASH_REGEX = /^pkce_[a-f0-9]*$/

const { parse } = createSearchParamsCache({
  resetToken: parseAsString,
})

const resolveLoginData = async ({ searchParams }: PageProps<'/login'>) => {
  const { resetToken } = await parse(searchParams)

  const view: Enum<AuthView> = resetToken
    ? TOKEN_HASH_REGEX.test(resetToken)
      ? 'password_reset'
      : 'invalid_token'
    : 'login'

  return { resetToken, view }
}

export const generateMetadata = async (props: PageProps<'/login'>) => {
  const { view } = await resolveLoginData(props)

  return intlMetadata({
    namespace: 'Auth',
    title: camelize(`${view}_title`),
  })
}

const LoginPage = async (props: PageProps<'/login'>) => {
  const { get } = await cookies()
  const username = await get('loginUser')
  const theme = await get('theme')
  const { resetToken, view } = await resolveLoginData(props)

  return (
    <div className="flex h-full min-h-screen flex-col gap-4 p-6 md:p-10">
      <AuthFlow resetToken={resetToken} username={username} view={view} />
      <div className="flex justify-end">
        <ThemeSwitch className="text-sm" defaultTheme={theme} tooltip={{ showArrow: false, side: 'top' }} />
      </div>
    </div>
  )
}

export default async (props: PageProps<'/login'>) => (
  <Suspense fallback={null}>
    <LoginPage {...props} />
  </Suspense>
)
