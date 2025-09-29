import { type User } from '@/lib/api/types'
import { redirect } from '@/lib/navigation'
import { cookies } from '@/lib/storage'

export const resetUser = () => {
  cookies.delete('user')
  redirect('/login')
  return {} as User
}
