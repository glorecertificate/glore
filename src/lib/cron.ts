import 'server-only'

import { timingSafeEqual } from 'node:crypto'

export const isAuthorizedCron = (request: Request) => {
  const secret = process.env.CRON_SECRET
  if (!secret || process.env.NODE_ENV !== 'production') return false

  const expected = Buffer.from(`Bearer ${secret}`)
  const received = Buffer.from(request.headers.get('authorization') ?? '')
  return expected.length === received.length && timingSafeEqual(expected, received)
}
