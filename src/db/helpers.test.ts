import { randomUUID } from 'node:crypto'

import { eq } from 'drizzle-orm'
import { DrizzleQueryError } from 'drizzle-orm/errors'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { queryError, safeQuery } from '@/db/helpers'
import { LOCAL_DATABASE_REGEX } from '~/scripts/seed-data'

const SQL = 'insert into "users" ("email", "password_hash") values ($1, $2)'
const PARAMS = ['holder@example.com', 'hash-that-must-stay-private']

const databaseError = (code: string, message: string, extra: Record<string, string> = {}) =>
  new DrizzleQueryError(SQL, PARAMS, Object.assign(new Error(message), { code, ...extra }))

describe('queryError', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('classifies a unique violation as a conflict from the Postgres code', () => {
    const error = queryError(databaseError('23505', 'duplicate key value violates unique constraint "users_email_key"'))
    expect(error.code).toBe('CONFLICT')
  })

  it('classifies a foreign key violation as a constraint violation', () => {
    const error = queryError(databaseError('23503', 'insert or update on table "memberships" violates foreign key'))
    expect(error.code).toBe('CONSTRAINT_VIOLATION')
  })

  it('classifies other integrity violations as constraint violations', () => {
    expect(queryError(databaseError('23502', 'null value in column "email"')).code).toBe('CONSTRAINT_VIOLATION')
    expect(queryError(databaseError('23514', 'new row violates check constraint')).code).toBe('CONSTRAINT_VIOLATION')
  })

  it('keeps timeouts, connection failures, and permission errors', () => {
    expect(queryError(databaseError('57014', 'canceling statement due to statement timeout')).code).toBe('TIMEOUT')
    expect(queryError(databaseError('08006', 'connection failure')).code).toBe('CONNECTION_ERROR')
    expect(queryError(databaseError('42501', 'permission denied for table users')).code).toBe('UNAUTHORIZED')
    expect(
      queryError(new DrizzleQueryError(SQL, PARAMS, new Error('timeout exceeded when trying to connect'))).code
    ).toBe('TIMEOUT')
    expect(queryError(new DrizzleQueryError(SQL, PARAMS, new Error('Connection terminated unexpectedly'))).code).toBe(
      'CONNECTION_ERROR'
    )
  })

  it('does not read the SQL text or the bound values to classify', () => {
    const error = new DrizzleQueryError(
      'select "connection_timeout", "unique" from "settings" where "name" = $1',
      ['not found duplicate unauthorized'],
      Object.assign(new Error('relation "connection_settings" does not exist'), { code: '42P01' })
    )
    expect(queryError(error).code).toBe('QUERY_ERROR')
  })

  it('returns a fixed message with no SQL or bound values', () => {
    const errors = [
      databaseError('23505', 'duplicate key value violates unique constraint "users_email_key"'),
      databaseError('23503', 'violates foreign key'),
      databaseError('42P01', 'relation "users" does not exist'),
      new DrizzleQueryError(SQL, PARAMS, new Error('Connection terminated unexpectedly')),
    ].map(queryError)

    for (const { message } of errors) {
      expect(message).not.toContain('insert into')
      expect(message).not.toContain('holder@example.com')
      expect(message).not.toContain('hash-that-must-stay-private')
      expect(message).not.toContain('users_email_key')
    }
    expect(new Set(errors.map(({ message }) => message)).size).toBe(4)
  })

  it('treats a raw Postgres error from a transaction like a wrapped one', () => {
    const raw = Object.assign(new Error('duplicate key value violates unique constraint "users_email_key"'), {
      code: '23505',
    })
    expect(queryError(raw)).toEqual({ code: 'CONFLICT', message: queryError(databaseError('23505', 'x')).message })
  })

  it('logs the real error on the server without the bound values', () => {
    queryError(
      databaseError('23505', 'duplicate key value violates unique constraint', { constraint: 'users_email_key' })
    )
    const logged = JSON.stringify(vi.mocked(console.error).mock.calls)
    expect(logged).toContain('23505')
    expect(logged).toContain('users_email_key')
    expect(logged).not.toContain('holder@example.com')
    expect(logged).not.toContain('hash-that-must-stay-private')
  })

  it('keeps the message and classification of errors the app throws itself', () => {
    expect(queryError(new Error('User not found'))).toEqual({ code: 'NOT_FOUND', message: 'User not found' })
    expect(queryError(new Error('Something broke'))).toEqual({ code: 'QUERY_ERROR', message: 'Something broke' })
    expect(queryError('boom')).toEqual({ code: 'QUERY_ERROR', message: 'boom' })
    expect(console.error).not.toHaveBeenCalled()
  })
})

describe('safeQuery', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns the data of a successful query', async () => {
    expect(await safeQuery(() => Promise.resolve(7))).toEqual({ data: 7, error: null })
  })

  it('returns the same sanitized error as queryError', async () => {
    const failure = databaseError('23505', 'duplicate key value violates unique constraint')
    const result = await safeQuery(() => Promise.reject(failure))
    expect(result).toEqual({ data: null, error: queryError(failure) })
    expect(result.error?.code).toBe('CONFLICT')
  })
})

describe.skipIf(!LOCAL_DATABASE_REGEX.test(process.env.DATABASE_URL ?? ''))('against Postgres', () => {
  const id = `helpers-${randomUUID().slice(0, 8)}`
  const email = `${id}@helpers.test`
  let client: typeof import('@/db/client')
  let schema: typeof import('@/db/schema')

  beforeEach(async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    ;[client, schema] = await Promise.all([import('@/db/client'), import('@/db/schema')])
    await client.db.delete(schema.users).where(eq(schema.users.id, id))
  })

  afterEach(async () => {
    await client.db.delete(schema.users).where(eq(schema.users.id, id))
    vi.restoreAllMocks()
  })

  it('reports a duplicate email as a conflict without leaking the statement', async () => {
    await client.db.insert(schema.users).values({ email, firstName: 'Helper', id, name: 'Helper' })
    const result = await safeQuery(() =>
      client.db.insert(schema.users).values({ email, firstName: 'Helper', id: `${id}-2`, name: 'Helper' })
    )

    expect(result.error?.code).toBe('CONFLICT')
    expect(result.error?.message).not.toContain('insert into')
    expect(result.error?.message).not.toContain(email)
  })

  it('reports a missing parent row as a constraint violation', async () => {
    const result = await safeQuery(() =>
      client.db.insert(schema.memberships).values({ organizationId: -1, role: 'volunteer', userId: id })
    )

    expect(result.error?.code).toBe('CONSTRAINT_VIOLATION')
    expect(result.error?.message).not.toContain('insert into')
  })
})
