import { beforeEach, describe, expect, it, vi } from 'vitest'

import { hashToken, issueToken, openToken, sealToken } from '@/lib/secret-token'

describe('secret tokens', () => {
  beforeEach(() => {
    vi.stubEnv('BETTER_AUTH_SECRET', 'a'.repeat(43).concat('='))
  })

  it('issues a token whose hash and seal match it', () => {
    const { token, tokenCipher, tokenHash } = issueToken()

    expect(token).toMatch(/^[\w-]{43}$/u)
    expect(tokenHash).toBe(hashToken(token))
    expect(tokenHash).toMatch(/^[0-9a-f]{64}$/u)
    expect(tokenCipher).not.toContain(token)
    expect(openToken(tokenCipher)).toBe(token)
  })

  it('hashes deterministically and seals with a fresh iv', () => {
    expect(hashToken('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
    expect(sealToken('abc')).not.toBe(sealToken('abc'))
  })

  it('rejects a tampered, truncated, or missing seal', () => {
    const sealed = sealToken('invite-token')
    const bytes = Buffer.from(sealed, 'base64url')
    bytes[bytes.length - 1] = (bytes.at(-1) ?? 0) ^ 1

    expect(openToken(bytes.toString('base64url'))).toBeNull()
    expect(openToken(sealed.slice(0, 20))).toBeNull()
    expect(openToken(null)).toBeNull()
  })

  it('rejects a seal made with another secret', () => {
    const sealed = sealToken('invite-token')
    vi.stubEnv('BETTER_AUTH_SECRET', 'b'.repeat(43).concat('='))

    expect(openToken(sealed)).toBeNull()
  })
})
