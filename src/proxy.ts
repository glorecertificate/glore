import 'server-only'

import { type NextProxy, NextResponse, type ProxyConfig } from 'next/server'

import { getProxyDatabase } from '@/db/client'
import { APP_ROOT, AUTH_ROOT, JOIN_ROOT, ONBOARDING_ROOT } from '@/lib/constants'

export const config: ProxyConfig = {
  matcher: [
    '/((?!_next/static|_next/image|api/|favicon.ico|sitemap.xml|robots.txt|manifest.json|.*.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

export const proxy: NextProxy = async request => {
  const { headers, nextUrl } = request
  const response = NextResponse.next({ request: { headers } })

  const isPublicPath = nextUrl.pathname === AUTH_ROOT || nextUrl.pathname.startsWith(JOIN_ROOT)

  try {
    const db = await getProxyDatabase(request)

    const {
      data: { user },
      error,
    } = await db.auth.getUser()

    if (error || !user) {
      if (error) await db.auth.signOut()
      if (isPublicPath) return response
      return NextResponse.redirect(new URL(AUTH_ROOT, request.url))
    }

    if (nextUrl.pathname === AUTH_ROOT) {
      return NextResponse.redirect(new URL(APP_ROOT, request.url))
    }

    const { data: profile } = await db.from('users').select('onboarded_at').eq('id', user.id).single()
    const onboardingComplete = !!profile?.onboarded_at
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

    const url = new URL(AUTH_ROOT, request.url)
    url.search = nextUrl.search
    return NextResponse.redirect(url)
  }
}
