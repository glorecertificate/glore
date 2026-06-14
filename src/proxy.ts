import 'server-only'

import { type NextProxy, NextResponse, type ProxyConfig } from 'next/server'

import { auth } from '@/lib/auth'
import { APP_ROOT, AUTH_ROOT, DASHBOARD_ROOTS, JOIN_ROOT, ONBOARDING_ROOT, REGISTER_ROOT } from '@/lib/constants'

export const config: ProxyConfig = {
  matcher: [
    '/((?!_next/static|_next/image|api/|favicon.ico|sitemap.xml|robots.txt|manifest.json|sw.js|offline|.*.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

const isPublicPath = (pathname: string) =>
  pathname === AUTH_ROOT ||
  pathname === REGISTER_ROOT ||
  pathname.startsWith(JOIN_ROOT) ||
  (!DASHBOARD_ROOTS.some(root => pathname.startsWith(root)) && /^\/[a-zA-Z0-9.]+$/u.test(pathname))

const expireSession = (request: Request) => {
  const url = new URL(AUTH_ROOT, request.url)
  if (request.headers.get('cookie')?.includes('session_token')) {
    url.searchParams.set('expired', 'true')
  }
  return NextResponse.redirect(url)
}

export const proxy: NextProxy = async request => {
  const { headers, nextUrl } = request
  const response = NextResponse.next({ request: { headers } })
  const isPublic = isPublicPath(nextUrl.pathname)
  const isOnboarding = nextUrl.pathname.startsWith(ONBOARDING_ROOT)

  try {
    const session = await auth.api.getSession({ headers })

    if (!session?.user) return isPublic ? response : expireSession(request)
    if (session.user.banned) return expireSession(request)
    if (nextUrl.pathname === AUTH_ROOT) return NextResponse.redirect(new URL(APP_ROOT, request.url))
    if (!(session.user.onboardedAt || isOnboarding)) return NextResponse.redirect(new URL(ONBOARDING_ROOT, request.url))
    if (session.user.onboardedAt && isOnboarding) return NextResponse.redirect(new URL(APP_ROOT, request.url))

    return response
  } catch {
    if (isPublic) return response
    return expireSession(request)
  }
}
