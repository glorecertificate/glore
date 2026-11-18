import { describe, expect, it } from 'vitest'

import { describeAuthError } from '@/lib/auth-log'

const named = (name: string, message: string, options?: ErrorOptions) =>
  Object.assign(new Error(message, options), { name })

const drizzleQueryError = (query: string, params: unknown[], cause: Error) =>
  Object.assign(named('DrizzleQueryError', `Failed query: ${query}\nparams: ${params.join(',')}`, { cause }), {
    params,
    query,
  })

describe('describeAuthError', () => {
  it('prints the cause of a query error and never the params', () => {
    const cause = named('NeonDbError', 'During prerendering, fetch() rejects when the prerender is complete.')
    const error = drizzleQueryError('select "token" from "sessions" where "token" = $1', ['secret-token'], cause)
    const line = describeAuthError(error)
    expect(line).toContain('DrizzleQueryError')
    expect(line).toContain('NeonDbError: During prerendering')
    expect(line).not.toContain('secret-token')
    expect(line).not.toContain('select')
    expect(line).not.toContain('params')
  })

  it('removes everything from params onward in a cause message', () => {
    const cause = new Error('Failed to read\nparams: secret-token')
    const line = describeAuthError(new Error('outer', { cause }))
    expect(line).toBe('outer | cause: Error: Failed to read')
  })

  it('walks at most two levels of causes', () => {
    const deep = new Error('level3')
    const error = new Error('level0', { cause: new Error('level1', { cause: new Error('level2', { cause: deep }) }) })
    const line = describeAuthError(error)
    expect(line).toContain('level2')
    expect(line).not.toContain('level3')
  })

  it('returns an empty string for a value that is not an error', () => {
    expect(describeAuthError(undefined)).toBe('')
    expect(describeAuthError('secret-token')).toBe('')
  })
})
