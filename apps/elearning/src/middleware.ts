'use server'

import { type MiddlewareConfig, type NextMiddleware, NextResponse } from 'next/server'

import { getLocale } from '@/lib/i18n'
import { authRoutes } from '@/lib/navigation'
import { createDatabaseClient } from '@/lib/ssr'

export const config: MiddlewareConfig = {
  matcher: [
    '/((?!_next/static|_next/image|api/|favicon.ico|sitemap.xml|robots.txt|manifest.json|.*.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

export const middleware: NextMiddleware = async request => {
  const isAuth = authRoutes.some(route => request.nextUrl.pathname.startsWith(route))

  const next = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  try {
    let response = next

    const db = await createDatabaseClient(() => {
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
