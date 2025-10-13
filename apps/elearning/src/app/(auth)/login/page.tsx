import { AuthFlow } from '@/components/features/auth/auth-flow'
import { createCookieStore } from '@/lib/server'

export default async () => {
  const { get } = await createCookieStore()
  return <AuthFlow token={get('login-token')} />
}
