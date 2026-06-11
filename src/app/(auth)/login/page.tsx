import { createSearchParamsCache } from 'nuqs/server'

import { cookies } from '@/actions/cookies'
import { AuthFlow } from '@/components/auth/auth-flow'
import { authParsers } from '@/components/auth/auth-params'
import { ThemeSwitch } from '@/components/ui/theme-switch'
import { intlMetadata } from '@/lib/metadata'

const { parse } = createSearchParamsCache(authParsers)

export const generateMetadata = async ({ searchParams }: PageProps<'/login'>) => {
  const { token } = await parse(searchParams)
  return intlMetadata({ namespace: 'Auth', title: `${token ? 'passwordReset' : 'login'}Title` })
}

const LoginPage = async ({ searchParams }: PageProps<'/login'>) => {
  const { get } = await cookies()
  const [username, theme, params] = await Promise.all([get('loginUser'), get('theme'), parse(searchParams)])

  return (
    <div className="flex h-full min-h-screen flex-col gap-4 p-6 md:p-10">
      <AuthFlow params={params} username={username} />
      <div className="flex justify-end">
        <ThemeSwitch className="text-sm" defaultTheme={theme} tooltip={{ showArrow: false, side: 'top' }} />
      </div>
    </div>
  )
}

export default LoginPage
