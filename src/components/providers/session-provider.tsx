import { getCookie } from '@/actions/cookies'
import { getCurrentUser } from '@/actions/user'
import { SessionContextProvider } from '@/components/providers/session-context'

export const SessionProvider = async ({ children }: React.PropsWithChildren) => {
  const user = await getCurrentUser()
  const org = await getCookie('org')
  const organizationId = org ? user.organizations.find(({ id }) => id === org)?.id : user.organizations[0]?.id
  const ctxValue = { organizationId, user }
  return <SessionContextProvider value={ctxValue}>{children}</SessionContextProvider>
}
