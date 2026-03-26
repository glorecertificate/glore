import 'server-only'

import { type NextProxy, NextResponse, type ProxyConfig } from 'next/server'

import { auth } from '@/lib/auth'
import { APP_ROOT, AUTH_ROOT, DASHBOARD_ROOTS, JOIN_ROOT, ONBOARDING_ROOT, REGISTER_ROOT } from '@/lib/constants'

export const config: ProxyConfig = {
  matcher: [
    '/((?!_next/static|_next/image|api/|favicon.ico|sitemap.xml|robots.txt|manifest.json|sw.js|offline|.*.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

const isCertificatePage = (pathname: string) =>
  /^\/[a-zA-Z0-9.]+$/.test(pathname) && !DASHBOARD_ROOTS.some(r => pathname.startsWith(r))

export const proxy: NextProxy = async request => {
  const { headers: reqHeaders, nextUrl } = request
  const response = NextResponse.next({ request: { headers: reqHeaders } })

  const isPublicPath =
    nextUrl.pathname === AUTH_ROOT ||
    nextUrl.pathname === REGISTER_ROOT ||
    nextUrl.pathname.startsWith(JOIN_ROOT) ||
    isCertificatePage(nextUrl.pathname)

  const expiredRedirect = () => {
    const url = new URL(AUTH_ROOT, request.url)
    if (reqHeaders.get('cookie')?.includes('session_token')) {
      url.searchParams.set('expired', 'true')
    }
    return NextResponse.redirect(url)
  }

  try {
    const session = await auth.api.getSession({ headers: reqHeaders })

    if (!session?.user) {
      if (isPublicPath) return response
      return expiredRedirect()
    }

    if (session.user.banned) {
      return expiredRedirect()
    }

    if (nextUrl.pathname === AUTH_ROOT) {
      return NextResponse.redirect(new URL(APP_ROOT, request.url))
    }

    const onboardingComplete = !!session.user.onboardedAt
    const isOnboardingPath = nextUrl.pathname.startsWith(ONBOARDING_ROOT)

    if (!(onboardingComplete || isOnboardingPath)) {
      return NextResponse.redirect(new URL(ONBOARDING_ROOT, request.url))
    }

    if (onboardingComplete && isOnboardingPath) {
      return NextResponse.redirect(new URL(APP_ROOT, request.url))
    }

    return response
  } catch {
    if (isPublicPath) return response

    return expiredRedirect()
  }
}
