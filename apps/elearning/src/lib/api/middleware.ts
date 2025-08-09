import { NextResponse, type NextMiddleware, type NextRequest } from 'next/server'

import { find as findUser } from '@/lib/api/modules/users/requests'
import { createReset, isAuthRequest } from '@/lib/api/utils'
import { createDatabase } from '@/lib/db/server'
import { DatabaseError, PostgRESTCode } from '@/lib/db/utils'
import { Route } from '@/lib/navigation'
import { setEncodedCookie } from '@/lib/storage/server'

export const verifySession: NextMiddleware = async (request: NextRequest) => {
  const next = NextResponse.next({ request: { headers: request.headers } })
  const isAuth = isAuthRequest(request)
  const resetUser = createReset(request, next, 'user')

  try {
    let response = next

    const db = await createDatabase(() => {
      response = NextResponse.next({ request })
    })

    const { data, error } = await db.auth.getUser()
    if (error) throw error
    if (!data?.user.id) throw new DatabaseError(PostgRESTCode.INVALID_CREDENTIALS)

    const user = await findUser(db, data.user.id)
    await setEncodedCookie('user', user)

    if (isAuth) return NextResponse.redirect(new URL(Route.Home, request.url))

    return response
  } catch {
    await resetUser()
    return next
  }
}
