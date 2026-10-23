import { unstable_rethrow } from 'next/navigation'

import { DrizzleQueryError } from 'drizzle-orm/errors'

import { IMPERSONATION_LOCKED } from '@/lib/constants'

type QueryErrorCode =
  | 'CONFLICT'
  | 'CONNECTION_ERROR'
  | 'CONSTRAINT_VIOLATION'
  | 'NOT_FOUND'
  | 'QUERY_ERROR'
  | 'TIMEOUT'
  | 'UNAUTHORIZED'

const DATABASE_ERROR_MESSAGES = {
  CONFLICT: 'Already exists',
  CONNECTION_ERROR: 'Database connection failed',
  CONSTRAINT_VIOLATION: 'Constraint violation',
  NOT_FOUND: 'Not found',
  QUERY_ERROR: 'Query failed',
  TIMEOUT: 'Database request timed out',
  UNAUTHORIZED: 'Not authorized',
} as const satisfies Record<QueryErrorCode, string>

const SQL_STATE_REGEX = /^[0-9A-Z]{5}$/u

const field = (source: unknown, key: string) => {
  if (typeof source !== 'object' || source === null || !(key in source)) return undefined
  const value = (source as Record<string, unknown>)[key]
  return typeof value === 'string' ? value : undefined
}

const databaseCause = (error: Error) => (error instanceof DrizzleQueryError ? error.cause : error)

const sqlState = (error: Error) => {
  const code = field(databaseCause(error), 'code')
  return code && SQL_STATE_REGEX.test(code) ? code : null
}

const isDatabaseError = (error: Error) => error instanceof DrizzleQueryError || sqlState(error) !== null

const messageCode = (message: string) => {
  const text = message.toLowerCase()
  if (text.includes('timeout') || text.includes('timed out')) return 'TIMEOUT'
  if (text.includes('connection')) return 'CONNECTION_ERROR'
  return null
}

const databaseCode = (error: Error): QueryErrorCode => {
  const state = sqlState(error)
  if (state === '23505') return 'CONFLICT'
  if (state?.startsWith('23')) return 'CONSTRAINT_VIOLATION'
  if (state === '42501') return 'UNAUTHORIZED'
  if (state === '57014') return 'TIMEOUT'
  if (state?.startsWith('08') || state === '53300' || state?.startsWith('57P')) return 'CONNECTION_ERROR'
  if (state) return 'QUERY_ERROR'
  return messageCode(field(databaseCause(error), 'message') ?? '') ?? 'QUERY_ERROR'
}

const errorCode = (error: Error): QueryErrorCode | typeof IMPERSONATION_LOCKED => {
  if (field(error, 'code') === IMPERSONATION_LOCKED) return IMPERSONATION_LOCKED
  const message = error.message.toLowerCase()
  if (message.includes('not found') || message.includes('no rows')) return 'NOT_FOUND'
  if (message.includes('unique') || message.includes('duplicate') || message.includes('already exists')) {
    return 'CONFLICT'
  }
  if (message.includes('foreign key') || message.includes('violates')) return 'CONSTRAINT_VIOLATION'
  if (message.includes('permission') || message.includes('unauthorized') || message.includes('not authenticated')) {
    return 'UNAUTHORIZED'
  }
  return messageCode(message) ?? 'QUERY_ERROR'
}

const logDatabaseError = (error: Error, code: QueryErrorCode) => {
  const cause = databaseCause(error)
  console.error('[db] query failed', {
    code,
    constraint: field(cause, 'constraint'),
    message: field(cause, 'message'),
    query: error instanceof DrizzleQueryError ? error.query : undefined,
    sqlState: sqlState(error),
    table: field(cause, 'table'),
  })
}

export const queryError = (e: unknown) => {
  unstable_rethrow(e)
  const error = e instanceof Error ? e : new Error(String(e))
  if (!isDatabaseError(error)) return { code: errorCode(error), message: error.message }
  const code = databaseCode(error)
  logDatabaseError(error, code)
  return { code, message: DATABASE_ERROR_MESSAGES[code] }
}

export const safeQuery = async <T>(query: () => Promise<T>) => {
  try {
    const data = await query()
    return { data, error: null }
  } catch (e) {
    return { data: null, error: queryError(e) }
  }
}

export const mapSequential = async <T, R>(items: T[], fn: (item: T) => Promise<R>) => {
  const results: R[] = []
  for (const item of items) {
    results.push(await fn(item))
  }
  return results
}
