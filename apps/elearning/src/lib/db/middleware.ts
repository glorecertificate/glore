import { NextResponse, type NextRequest } from 'next/server'

import { getDatabase } from '@/lib/db/server'
import { AuthPage, Route } from '@/lib/navigation'

export const updateSession = async (request: NextRequest) => {
  try {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    const db = await getDatabase(() => {
      response = NextResponse.next({ request })
    })

    const { error } = await db.auth.getUser()

    const isAuthPage = Object.values(AuthPage).includes(request.nextUrl.pathname as AuthPage)

    if (error) {
      return isAuthPage ? response : NextResponse.redirect(new URL(Route.Login, request.url))
    }

    return isAuthPage ? NextResponse.redirect(new URL(Route.Home, request.url)) : response
  } catch {
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
  }
}
