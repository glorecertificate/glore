import { PostgrestError } from '@supabase/supabase-js'

const DATABASE_ERROR_CODES = [
  'PGRST116', // NO_RESULTS
  'PGRST401', // UNAUTHENTICATED
  '28P01', // INVALID_CREDENTIALS
  '23505', // CONFLICT
  'same_password',
  'NETWORK_ERROR',
  'UNKNOWN',
]

export type DatabaseErrorCode = (typeof DATABASE_ERROR_CODES)[number]

export interface DatabaseErrorContext {
  code: string
  message?: string
  details?: string
  hint?: string
}

export class DatabaseError extends PostgrestError {
  code: DatabaseErrorCode

  constructor({ code, message = 'A database error occurred', details = '', hint = '' }: DatabaseErrorContext) {
    super({ message, code, details, hint })
    this.name = 'DatabaseError'
    this.code = DATABASE_ERROR_CODES.includes(code) ? code : 'UNKNOWN'
  }
}
