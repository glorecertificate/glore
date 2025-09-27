import { serialize } from '@repo/utils/serialize'
import { type AnyRecord } from '@repo/utils/types'

import { DATABASE_ERRORS } from './config'
import { type DatabaseErrorCode, type PublicTable, type SelectData } from './types'

/**
 * Custom error class for handling database-related errors.
 */
export class DatabaseError extends Error {
  readonly code: DatabaseErrorCode

  constructor(code: DatabaseErrorCode, message?: string) {
    const group = Object.values(DATABASE_ERRORS).find(({ codes }) => codes.includes(code as never))

    super(message ?? group?.message)
    this.name = 'DatabaseError'
    this.code = code
  }
}

/**
 * Creates a parser function from a database record.
 */
export const createParser =
  <T extends PublicTable, Q extends string, O extends AnyRecord>(parser: (r: SelectData<T, Q>) => O) =>
  (record: SelectData<T, Q>) =>
    serialize(parser(record))
