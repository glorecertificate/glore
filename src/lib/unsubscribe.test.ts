import { beforeEach, describe, expect, it, vi } from 'vitest'

import { parseUnsubscribeToken, unsubscribeUrl } from '@/lib/unsubscribe'

const tokenOf = (url: string) => new URL(url).searchParams.get('token')

describe('unsubscribe tokens', () => {
  beforeEach(() => {
    vi.stubEnv('APP_URL', 'https://glore.test')
    vi.stubEnv('BETTER_AUTH_SECRET', 'a'.repeat(43).concat('='))
  })

  it('round-trips a signed token', () => {
    const url = unsubscribeUrl('user-1', 'reminders')

    expect(url.startsWith('https://glore.test/api/v1/mail-preferences?token=')).toBe(true)
    expect(parseUnsubscribeToken(tokenOf(url))).toEqual({ category: 'reminders', userId: 'user-1' })
  })

  it('rejects a changed user, category, or signature', () => {
    const token = tokenOf(unsubscribeUrl('user-1', 'reminders')) ?? ''
    const [, , signature] = token.split('.')

    expect(parseUnsubscribeToken(`user-2.reminders.${signature}`)).toBeNull()
    expect(parseUnsubscribeToken(`user-1.learning.${signature}`)).toBeNull()
    expect(parseUnsubscribeToken(`user-1.reminders.${signature?.slice(0, -1)}x`)).toBeNull()
    expect(parseUnsubscribeToken('user-1.mandatory.abc')).toBeNull()
    expect(parseUnsubscribeToken(null)).toBeNull()
  })

  it('rejects a token signed with another secret', () => {
    const token = tokenOf(unsubscribeUrl('user-1', 'learning'))
    vi.stubEnv('BETTER_AUTH_SECRET', 'b'.repeat(43).concat('='))

    expect(parseUnsubscribeToken(token)).toBeNull()
  })
})
