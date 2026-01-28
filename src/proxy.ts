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

    const { data } = await db.auth.getSession()
    const { expires_at } = data.session ?? {}
    const expired = !expires_at || expires_at * 1000 < Date.now() + 60 * 1000

    if (expired) {
      const { error } = await db.auth.getUser()

      if (error) {
        await db.auth.signOut()
        return NextResponse.redirect(new URL(AUTH_ROOT, request.url))
      }
    }

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
