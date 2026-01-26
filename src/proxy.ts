import 'server-only'

import { type NextProxy, NextResponse, type ProxyConfig } from 'next/server'

import { getProxyDatabase } from '@/db/client'
import { APP_ROOT, AUTH_ROOT } from '@/lib/constants'

export const config: ProxyConfig = {
  matcher: [
    '/((?!_next/static|_next/image|api/|favicon.ico|sitemap.xml|robots.txt|manifest.json|.*.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

export const proxy: NextProxy = async request => {
  const { headers, nextUrl } = request
  const response = NextResponse.next({ request: { headers } })

  try {
    const db = await getProxyDatabase(request)
    const { error } = await db.auth.getUser()
    if (error) throw error

    if (nextUrl.pathname === AUTH_ROOT) {
      return NextResponse.redirect(new URL(APP_ROOT, request.url))
    }

    return response
  } catch {
    if (nextUrl.pathname === AUTH_ROOT) return response

    const url = new URL(AUTH_ROOT, request.url)
    url.search = nextUrl.search
    return NextResponse.redirect(url)
  }
}
