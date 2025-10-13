import { Suspense, use } from 'react'

import { type Enum } from '@glore/utils/types'

import { AuthFlow } from '@/components/features/auth/auth-flow'
import { type AuthView } from '@/lib/navigation'

const TOKEN_HASH_REGEX = /^pkce_[a-f0-9]{56}$/

const resolveLoginPageData = async ({ searchParams }: PageProps<'/login'>) => {
  const { resetToken } = await searchParams
  const token = Array.isArray(resetToken) ? undefined : resetToken

  const defaultView: Enum<AuthView> = token
    ? TOKEN_HASH_REGEX.test(token)
      ? 'password_reset'
      : 'invalid_token'
    : 'login'

  return { defaultView, token }
}

const LoginPageContent = (props: PageProps<'/login'>) => {
  const { defaultView, token } = use(resolveLoginPageData(props))
  return <AuthFlow defaultView={defaultView} token={token} />
}

export default (props: PageProps<'/login'>) => (
  <Suspense fallback={null}>
    <LoginPageContent {...props} />
  </Suspense>
)
