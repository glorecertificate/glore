import { getImpersonation } from '@/actions/admin/impersonation-state'
import { getCurrentUser } from '@/actions/user'
import { fullName } from '@/lib/utils'

import { ImpersonationNotice } from './impersonation-notice'

export const ImpersonationBanner = async () => {
  const state = await getImpersonation()
  if (!state) return null

  const user = await getCurrentUser()
  return <ImpersonationNotice expiresAt={state.expiresAt} name={fullName(user) || user.email} reason={state.reason} />
}
