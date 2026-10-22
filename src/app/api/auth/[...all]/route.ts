import { toNextJsHandler } from 'better-auth/next-js'

import { auth } from '@/lib/auth'
import { isClosedAuthPath } from '@/lib/http'

const handler = toNextJsHandler(auth)

const closeAdminPaths = (method: (request: Request) => Promise<Response>) => async (request: Request) => {
  if (isClosedAuthPath(request.url)) return new Response('Not Found', { status: 404 })
  return await method(request)
}

export const GET = closeAdminPaths(handler.GET)
export const POST = closeAdminPaths(handler.POST)
