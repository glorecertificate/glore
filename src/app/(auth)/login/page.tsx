import { Suspense } from 'react'

import { createSearchParamsCache, parseAsString } from 'nuqs/server'

import { cookies } from '@/actions/cookies'
import { AuthFlow } from '@/components/features/auth/auth-flow'
import { ThemeSwitch } from '@/components/ui/theme-switch'
import { intlMetadata } from '@/lib/metadata'
import { AuthView } from '@/lib/types'
import { camelize } from '@/lib/utils'

const { parse } = createSearchParamsCache({ expired: parseAsString, token: parseAsString })

const resolveParams = async ({ searchParams }: PageProps<'/login'>) => {
  const { expired, token } = await parse(searchParams)
  const view: AuthView = token ? 'password_reset' : 'login'
  return { expired: expired === 'true', resetToken: token, view }
}

export const generateMetadata = async (props: PageProps<'/login'>) => {
  const { view } = await resolveParams(props)
  return intlMetadata({ namespace: 'Auth', title: camelize(`${view}_title`) })
}

const LoginPage = async (props: PageProps<'/login'>) => {
  const { get } = await cookies()
  const [username, theme, { expired, resetToken, view }] = await Promise.all([
    get('loginUser'),
    get('theme'),
    resolveParams(props),
  ])
  const tooltip = Object.freeze({ showArrow: false, side: 'top' })

  return (
    <div className="flex h-full min-h-screen flex-col gap-4 p-6 md:p-10">
      <AuthFlow resetToken={resetToken} sessionExpired={expired} username={username} view={view} />
      <div className="flex justify-end">
        <ThemeSwitch className="text-sm" defaultTheme={theme} tooltip={tooltip} />
      </div>
    </div>
  )
}

export default (props: PageProps<'/login'>) => (
  <Suspense fallback={null}>
    <LoginPage {...props} />
  </Suspense>
)
