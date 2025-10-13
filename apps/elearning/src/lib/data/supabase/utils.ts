import { PostgrestError } from '@supabase/supabase-js'

export type DatabaseErrorCode =
  | 'PGRST116' // NO_RESULTS
  | '23505' // CONFLICT
  | '28P01' // INVALID_CREDENTIALS
  | 'same_password'
  | 'NETWORK_ERROR'
  | 'unknown_error'

export interface DatabaseErrorContext {
  code: DatabaseErrorCode | string
  message?: string
  details?: string
  hint?: string
}

export class DatabaseError extends PostgrestError {
  code: DatabaseErrorCode

  constructor({ code, message = 'A database error occurred', details = '', hint = '' }: DatabaseErrorContext) {
    super({ message, code, details, hint })
    this.name = 'DatabaseError'
    this.code = code as DatabaseErrorCode
  }
}
