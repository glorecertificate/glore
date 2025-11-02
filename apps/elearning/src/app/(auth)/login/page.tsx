import { type Enum } from '@glore/utils/types'

import { AuthFlow } from '@/components/features/auth/auth-flow'
import { ThemeSwitch } from '@/components/ui/theme-switch'
import { type AuthView } from '@/lib/navigation'
import { serverCookies } from '@/lib/storage/server'

const TOKEN_HASH_REGEX = /^pkce_[a-f0-9]{56}$/

export default async ({ searchParams }: PageProps<'/login'>) => {
  const cookies = await serverCookies()
  const { resetToken } = await searchParams

  const token = Array.isArray(resetToken) ? undefined : resetToken
  const view: Enum<AuthView> = token ? (TOKEN_HASH_REGEX.test(token) ? 'password_reset' : 'invalid_token') : 'login'
  const username = cookies.get('login_user')
  const theme = cookies.get('theme')

  return (
    <div className="flex h-full min-h-screen flex-col gap-4 p-6 md:p-10">
      <AuthFlow defaultUsername={username} defaultView={view} token={token} />
      <div className="flex justify-end">
        <ThemeSwitch className="text-sm" defaultTheme={theme} tooltip={{ arrow: false, side: 'top' }} />
      </div>
    </div>
  )
}
