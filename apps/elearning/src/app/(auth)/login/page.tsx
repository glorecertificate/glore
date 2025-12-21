import { Suspense } from 'react'

import { createLoader, parseAsString } from 'nuqs/server'

import { toCamelCase } from '@glore/utils/to-camel-case'
import type { Enum } from '@glore/utils/types'

import { cookies } from '@/actions/cookies'
import { AuthFlow, type AuthView } from '@/components/features/auth/auth-flow'
import { ThemeSwitch } from '@/components/ui/theme-switch'
import { intlMetadata } from '@/lib/metadata'

const TOKEN_HASH_REGEX = /^pkce_[a-f0-9]{56}$/

export const loadSearchParams = createLoader({
  resetToken: parseAsString,
})

const resolvePageData = async ({ searchParams }: PageProps<'/login'>) => {
  const { resetToken } = await loadSearchParams(searchParams)
  const view: Enum<AuthView> = resetToken
    ? TOKEN_HASH_REGEX.test(resetToken)
      ? 'password_reset'
      : 'invalid_token'
    : 'login'
  return { resetToken, view }
}

export const generateMetadata = async (props: PageProps<'/login'>) => {
  const { view } = await resolvePageData(props)

  return intlMetadata({
    applicationName: false,
    title: `Auth.${toCamelCase(`${view}_title`)}`,
  })
}

const LoginPage = async (props: PageProps<'/login'>) => {
  const { resetToken, view } = await resolvePageData(props)

  const { get } = await cookies()
  const username = await get('login_user')
  const theme = await get('theme')

  return (
    <div className="flex h-full min-h-screen flex-col gap-4 p-6 md:p-10">
      <AuthFlow defaultUsername={username} defaultView={view} resetToken={resetToken} />
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
