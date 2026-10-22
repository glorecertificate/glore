import { type AuthView } from '@/lib/types'
import { camelize } from '@/lib/utils'

export const defaultAuthView = ({ error, token }: { error?: string | null; token?: string | null }): AuthView => {
  if (error === 'INVALID_TOKEN') return 'invalid_token'
  if (token) return 'password_reset'
  return 'login'
}

export const authMetaTitleKey = (view: AuthView) => `${camelize(view)}MetaTitle` as const
