import { snakeToCamel } from '@glore/utils/string'
import { type Enum } from '@glore/utils/types'

import { AuthFlow } from '@/components/features/auth/auth-flow'
import { ThemeSwitch } from '@/components/ui/theme-switch'
import { createIntlMetadata } from '@/lib/metadata'
import { type AuthView } from '@/lib/navigation'
import { serverCookies } from '@/lib/storage/server'

const TOKEN_HASH_REGEX = /^pkce_[a-f0-9]{56}$/

const resolvePageData = async ({ searchParams }: PageProps<'/login'>) => {
  const { resetToken } = await searchParams
  const token = Array.isArray(resetToken) ? undefined : resetToken
  const view: Enum<AuthView> = token ? (TOKEN_HASH_REGEX.test(token) ? 'password_reset' : 'invalid_token') : 'login'
  return { token, view }
}

export const generateMetadata = async (props: PageProps<'/login'>) => {
  const { view } = await resolvePageData(props)

  return createIntlMetadata({
    title: `Auth.${snakeToCamel(`${view}_title`)}`,
  })
}

export default async (props: PageProps<'/login'>) => {
  const { token, view } = await resolvePageData(props)

  const cookies = await serverCookies()
  const username = cookies.get('login_user')
  const theme = cookies.get('theme')

  return (
    <div className="flex h-full min-h-screen flex-col gap-4 p-6 md:p-10">
      <AuthFlow defaultUsername={username} defaultView={view} token={token} />
      <div className="flex justify-end">
        <ThemeSwitch className="text-sm" defaultTheme={theme} tooltip={{ showArrow: false, side: 'top' }} />
      </div>
    </div>
  )
}
