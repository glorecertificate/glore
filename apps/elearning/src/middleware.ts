import { NextResponse, type MiddlewareConfig, type NextMiddleware, type NextRequest } from 'next/server'

import { createDatabase } from '@/lib/db/server'
import { AuthPage, Route } from '@/lib/navigation'

export const config: MiddlewareConfig = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.json|.*.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

export const middleware: NextMiddleware = async (request: NextRequest) => {
  try {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    const db = await createDatabase(() => {
      response = NextResponse.next({ request })
    })

    const isAuth = Object.values(AuthPage).includes(request.nextUrl.pathname as AuthPage)

    const { error } = await db.auth.getUser()

    if (error) {
      return isAuth ? response : NextResponse.redirect(new URL(Route.Login, request.url))
    }

    return isAuth ? NextResponse.redirect(new URL(Route.Home, request.url)) : response
  } catch {
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
  }
}
