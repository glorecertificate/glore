import 'server-only'

import { type NextProxy, NextResponse, type ProxyConfig } from 'next/server'

import { i18n } from '@/lib/i18n'
import { verifyAuthUser } from '@/middleware/auth'

export const config: ProxyConfig = {
  matcher: [
    '/((?!_next/static|_next/image|api/|favicon.ico|sitemap.xml|robots.txt|manifest.json|.*.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

export const proxy: NextProxy = async request => {
  const { headers, nextUrl } = request

  const response = NextResponse.next({ request: { headers } })

  const locale = nextUrl.searchParams.get('locale') ?? nextUrl.searchParams.get('lang')
  if (locale) response.cookies.set(i18n.cookie, locale)

  try {
    await verifyAuthUser(request)
    if (request.nextUrl.pathname !== '/login') return response
    return NextResponse.redirect(new URL('/', request.url))
  } catch {
    if (request.nextUrl.pathname === '/login') return response
    return NextResponse.redirect(new URL('/login', request.url))
  }
}
