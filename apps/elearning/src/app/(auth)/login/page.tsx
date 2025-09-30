import { AuthFlow } from '@/components/features/auth/auth-flow'
import { createCookieClient } from '@/lib/storage'

export default async () => {
  const { get } = await createCookieClient()
  return <AuthFlow token={get('login-token')} />
}
