import 'server-only'

import { createHmac, timingSafeEqual } from 'node:crypto'

const UNSUBSCRIBE_CATEGORIES = ['learning', 'organization', 'reminders'] as const

export type UnsubscribeCategory = (typeof UNSUBSCRIBE_CATEGORIES)[number]

const signature = (payload: string) =>
  createHmac('sha256', process.env.BETTER_AUTH_SECRET).update(`unsubscribe:${payload}`).digest('base64url')

const createUnsubscribeToken = (userId: string, category: UnsubscribeCategory) => {
  const payload = `${userId}.${category}`
  return `${payload}.${signature(payload)}`
}

export const parseUnsubscribeToken = (token: string | null) => {
  const parts = token?.split('.') ?? []
  if (parts.length !== 3) return null
  const [userId, category, received] = parts
  if (!(userId && category && received)) return null
  if (!UNSUBSCRIBE_CATEGORIES.includes(category as UnsubscribeCategory)) return null

  const expected = Buffer.from(signature(`${userId}.${category}`))
  const actual = Buffer.from(received)
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null
  return { category: category as UnsubscribeCategory, userId }
}

export const unsubscribeUrl = (userId: string, category: UnsubscribeCategory) =>
  `${process.env.APP_URL}/api/v1/mail-preferences?token=${encodeURIComponent(createUnsubscribeToken(userId, category))}`
