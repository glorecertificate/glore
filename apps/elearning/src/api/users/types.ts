import type { getCurrentUser } from './requests'

export type User = Awaited<ReturnType<typeof getCurrentUser>>
export type UserOrg = User['current_org']
