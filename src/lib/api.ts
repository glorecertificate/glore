import 'server-only'

import { type NextRequest, NextResponse } from 'next/server'

import { auth } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'

const MAX_JSON_BODY_LENGTH = 256 * 1024

const deny = (error: string, status: number) => ({ response: NextResponse.json({ error }, { status }), user: null })

export const authorizeEditorRequest = async (request: NextRequest, scope: string, maxPerMinute: number) => {
  const session = await auth.api.getSession({ headers: request.headers, query: { disableCookieCache: true } })
  const user = session?.user
  if (!user || user.banned) return deny('Unauthorized', 401)
  if (user.role !== 'admin' && !user.isEditor) return deny('Forbidden', 403)

  const { limited } = await checkRateLimit(`${scope}:${user.id}`, maxPerMinute, 60_000)
  if (limited) return deny('Too many requests', 429)

  return { response: null, user }
}

export const readJsonBody = async (request: NextRequest): Promise<unknown> => {
  const text = await request.text()
  if (text.length > MAX_JSON_BODY_LENGTH) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}
