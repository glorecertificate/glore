import { NextResponse, type NextRequest } from 'next/server'

import { Path } from '@/lib/navigation'
import { getDB } from '@/services/db'

export enum AuthPage {
  Login = Path.Login,
  PasswordReset = Path.PasswordReset,
}

export const updateSession = async (request: NextRequest) => {
  try {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    const db = await getDB(() => {
      response = NextResponse.next({ request })
    })

    const { error } = await db.auth.getUser()

    const isAuthPage = Object.values(AuthPage).includes(request.nextUrl.pathname as AuthPage)

    if (error) {
      return isAuthPage ? response : NextResponse.redirect(new URL(Path.Login, request.url))
    }

    return isAuthPage ? NextResponse.redirect(new URL(Path.Home, request.url)) : response
  } catch {
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
  }
}
