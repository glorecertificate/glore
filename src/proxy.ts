import 'server-only'

import { type NextProxy, NextResponse, type ProxyConfig } from 'next/server'

import { eq } from 'drizzle-orm'

import { db } from '@/db/client'
import { users } from '@/db/schema'
import { auth } from '@/lib/auth/server'
import { APP_ROOT, AUTH_ROOT, JOIN_ROOT, ONBOARDING_ROOT } from '@/lib/constants'

export const config: ProxyConfig = {
  matcher: [
    '/((?!_next/static|_next/image|api/|favicon.ico|sitemap.xml|robots.txt|manifest.json|.*.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

export const proxy: NextProxy = async request => {
  const { headers: reqHeaders, nextUrl } = request
  const response = NextResponse.next({ request: { headers: reqHeaders } })

  const isPublicPath = nextUrl.pathname === AUTH_ROOT || nextUrl.pathname.startsWith(JOIN_ROOT)

  try {
    const session = await auth.api.getSession({ headers: reqHeaders })

    if (!session?.user) {
      if (isPublicPath) return response
      return NextResponse.redirect(new URL(AUTH_ROOT, request.url))
    }

    if (nextUrl.pathname === AUTH_ROOT) {
      return NextResponse.redirect(new URL(APP_ROOT, request.url))
    }

    const profile = await db.query.users.findFirst({
      columns: { onboardedAt: true },
      where: eq(users.id, session.user.id),
    })
    const onboardingComplete = !!profile?.onboardedAt
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
