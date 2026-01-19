import 'server-only'

import { type NextProxy, NextResponse, type ProxyConfig } from 'next/server'

import { APP_ROOT, AUTH_ROOT } from '@/lib/constants'
import { verifyAuthUser } from '@/middleware/auth'

export const config: ProxyConfig = {
  matcher: [
    '/((?!_next/static|_next/image|api/|favicon.ico|sitemap.xml|robots.txt|manifest.json|.*.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

export const proxy: NextProxy = async request => {
  const { headers } = request
  const response = NextResponse.next({ request: { headers } })

  try {
    await verifyAuthUser(request)
    if (request.nextUrl.pathname !== AUTH_ROOT) return response
    return NextResponse.redirect(new URL(APP_ROOT, request.url))
  } catch {
    if (request.nextUrl.pathname === AUTH_ROOT) return response
    return NextResponse.redirect(new URL(AUTH_ROOT, request.url))
  }
}
