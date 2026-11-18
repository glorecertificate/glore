import { auth } from '@/lib/auth'
import { APP_ROOT, AUTH_ROOT } from '@/lib/constants'
import { safeNextPath } from '@/lib/next-path'

const redirectTo = (location: string, headers = new Headers()) => {
  headers.set('location', location)
  return new Response(null, { headers, status: 307 })
}

export const GET = async (request: Request) => {
  const session = await auth.api.getSession({ headers: request.headers, query: { disableCookieCache: true } })
  if (session?.user && !session.user.banned) return redirectTo(APP_ROOT)

  const signOut = await auth.api.signOut({ asResponse: true, headers: request.headers })
  const headers = new Headers()

  for (const cookie of signOut.headers.getSetCookie()) {
    headers.append('set-cookie', cookie)
  }

  const next = safeNextPath(new URL(request.url).searchParams.get('next'))
  const params = new URLSearchParams({ expired: 'true' })
  if (next) params.set('next', next)

  return redirectTo(`${AUTH_ROOT}?${params.toString()}`, headers)
}
