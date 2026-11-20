'use server'

import 'server-only'

import { findPendingInvitations } from '@/actions/shell/invitations-core'
import { getCurrentUser } from '@/actions/user'

export const listMyPendingInvitations = async () => {
  const user = await getCurrentUser()
  return await findPendingInvitations({
    email: user.email,
    memberOf: user.organizations.map(({ id }) => id),
    now: Date.now(),
    userId: user.id,
  })
}
