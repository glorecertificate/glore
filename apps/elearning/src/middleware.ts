import { NextResponse, type MiddlewareConfig, type NextMiddleware } from 'next/server'

import { createDatabase } from '@/lib/db/server'
import { AuthPage, Route } from '@/lib/navigation'

export const config: MiddlewareConfig = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.json|.*.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

export const middleware: NextMiddleware = async request => {
  const next = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  try {
    let response = next

    const db = await createDatabase(() => {
      response = NextResponse.next({ request })
    })

    const { error } = await db.auth.getUser()

    const isAuth = Object.values(AuthPage).includes(request.nextUrl.pathname as AuthPage)

    if (error) {
      return isAuth ? response : NextResponse.redirect(new URL(Route.Login, request.url))
    }

    return isAuth ? NextResponse.redirect(new URL(Route.Home, request.url)) : response
  } catch {
    return next
  }
}
