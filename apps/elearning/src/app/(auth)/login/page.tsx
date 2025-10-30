import { use } from 'react'

import { type Enum } from '@glore/utils/types'

import { AuthFlow } from '@/components/features/auth/auth-flow'
import { SuspenseLayout } from '@/components/layout/suspense-layout'
import { type AuthView } from '@/lib/navigation'
import { serverCookies } from '@/lib/storage/server'

const TOKEN_HASH_REGEX = /^pkce_[a-f0-9]{56}$/

const resolveLoginPageData = async ({ searchParams }: PageProps<'/login'>) => {
  const cookies = await serverCookies()
  const { resetToken } = await searchParams

  const token = Array.isArray(resetToken) ? undefined : resetToken

  const view: Enum<AuthView> = token ? (TOKEN_HASH_REGEX.test(token) ? 'password_reset' : 'invalid_token') : 'login'

  const email = cookies.get('email')

  return { view, email, token }
}

const LoginPageContent = (props: PageProps<'/login'>) => {
  const { view, email, token } = use(resolveLoginPageData(props))
  return <AuthFlow defaultEmail={email} defaultView={view} token={token} />
}

export default (props: PageProps<'/login'>) => (
  <SuspenseLayout size="full">
    <LoginPageContent {...props} />
  </SuspenseLayout>
)
