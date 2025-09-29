import { AuthFlow } from '@/components/features/auth/auth-flow'
import { getEncodedCookie } from '@/lib/storage/ssr'

export default async () => {
  const token = await getEncodedCookie('login-token')
  return <AuthFlow token={token} />
}
