import { describe, expect, it } from 'vitest'

import { isClosedAuthPath, readLimitedBody } from '@/lib/http'

const streamOf = (chunks: number[]) =>
  new ReadableStream<Uint8Array>({
    start(controller) {
      for (const size of chunks) controller.enqueue(new Uint8Array(size).fill(1))
      controller.close()
    },
  })

describe('readLimitedBody', () => {
  it('returns every byte within the limit', async () => {
    const { bytes, tooLarge } = await readLimitedBody(streamOf([3, 4]), 10)
    expect(tooLarge).toBe(false)
    expect(bytes?.byteLength).toBe(7)
  })

  it('stops reading once the limit is passed', async () => {
    let pulled = 0
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulled += 1
        controller.enqueue(new Uint8Array(4))
      },
    })
    const result = await readLimitedBody(body, 10)
    expect(result).toEqual({ bytes: null, tooLarge: true })
    expect(pulled).toBeLessThan(10)
  })

  it('treats a missing body as empty', async () => {
    const { bytes, tooLarge } = await readLimitedBody(null, 10)
    expect(tooLarge).toBe(false)
    expect(bytes?.byteLength).toBe(0)
  })
})

describe('isClosedAuthPath', () => {
  it('closes the admin plugin endpoints', () => {
    expect(isClosedAuthPath('https://glore.localhost/api/auth/admin/list-users')).toBe(true)
    expect(isClosedAuthPath('https://glore.localhost/api/auth/admin')).toBe(true)
  })

  it('closes the admin plugin impersonation endpoints', () => {
    expect(isClosedAuthPath('https://glore.localhost/api/auth/admin/impersonate-user')).toBe(true)
    expect(isClosedAuthPath('https://glore.localhost/api/auth//Admin/stop-impersonating')).toBe(true)
  })

  it('closes encoded, doubled, and upper-case variants', () => {
    expect(isClosedAuthPath('https://glore.localhost/api/auth//admin/ban-user')).toBe(true)
    expect(isClosedAuthPath('https://glore.localhost/api/auth/%61dmin/set-role')).toBe(true)
    expect(isClosedAuthPath('https://glore.localhost/api/auth/ADMIN/impersonate-user')).toBe(true)
  })

  it('keeps the other auth endpoints open', () => {
    expect(isClosedAuthPath('https://glore.localhost/api/auth/sign-in/email')).toBe(false)
    expect(isClosedAuthPath('https://glore.localhost/api/auth/get-session')).toBe(false)
    expect(isClosedAuthPath('https://glore.localhost/api/auth/administrator')).toBe(false)
  })
})
