'use server'

import { type NextProxy, NextResponse, type ProxyConfig } from 'next/server'

import { getLocale } from 'next-intl/server'

import { getDatabase } from '@/lib/data/server'
import { AUTH_ROUTES } from '@/lib/navigation'

export const proxy: NextProxy = async request => {
  const isAuth = AUTH_ROUTES.some(route => request.nextUrl.pathname.startsWith(route))

  const next = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  try {
    let response = next

    const db = await getDatabase(() => {
      response = NextResponse.next({ request })
    })

    const { error } = await db.auth.getUser()

    if (error) {
      if (!isAuth) return NextResponse.redirect(new URL('/login', request.url))

      const locale = await getLocale()
      const lang = new URL(request.url).searchParams.get('lang')
      if (lang && lang !== locale) response.headers.append('Set-Cookie', `NEXT_LOCALE=${lang}`)

      return response
    }

    return isAuth ? NextResponse.redirect(new URL('/', request.url)) : response
  } catch {
    return next
  }
}

export const config: ProxyConfig = {
  matcher: [
    '/((?!_next/static|_next/image|api/|favicon.ico|sitemap.xml|robots.txt|manifest.json|.*.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
