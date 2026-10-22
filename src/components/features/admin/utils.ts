import { type AdminUserRow } from '@/db/queries/admin-user'
import { fullName } from '@/lib/utils'

export const userLabel = (user: Pick<AdminUserRow, 'email' | 'firstName' | 'lastName' | 'username'>) =>
  fullName(user) || (user.username ? `@${user.username}` : user.email)

export const userInitials = (user: Pick<AdminUserRow, 'firstName' | 'lastName'>) =>
  [user.firstName, user.lastName]
    .flatMap(name => (name?.trim() ? [name.trim().charAt(0).toUpperCase()] : []))
    .slice(0, 2)
    .join('')
