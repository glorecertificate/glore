import { AuthFlow } from '@/components/features/auth/auth-flow'
import { createCookieStore } from '@/lib/ssr'

export default async () => {
  const { get } = await createCookieStore()
  return <AuthFlow token={get('login-token')} />
}
