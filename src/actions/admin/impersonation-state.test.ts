import { beforeEach, describe, expect, it, vi } from 'vitest'

const calls = vi.hoisted(() => [] as string[])

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: () => {
        calls.push('getSession')
        return Promise.resolve(null)
      },
    },
  },
}))
vi.mock('@/db/client', () => ({ db: {} }))
vi.mock('next/headers', () => ({ headers: () => Promise.resolve(new Headers()) }))
vi.mock('next/server', () => ({
  connection: () => {
    calls.push('connection')
    return Promise.resolve()
  },
}))

describe('impersonation state', () => {
  beforeEach(() => {
    calls.length = 0
  })

  it.each(['getImpersonation', 'readImpersonation', 'isImpersonating'] as const)(
    '%s reads the session only at request time',
    async name => {
      const state = await import('@/actions/admin/impersonation-state')

      await state[name]()

      expect(calls).toEqual(['connection', 'getSession'])
    }
  )
})
