export enum DatabaseErrorCode {
  'INVALID_CREDENTIALS' = 'invalid_credentials',
  'NETWORK_ERROR' = 'NETWORK_ERROR',
  'NO_RESULTS' = 'PGRST116',
}

const NETWORK_MESSAGE = 'TypeError: Failed to fetch'

/**
 * Database error format.
 *
 * @see {@link https://postgrest.org/en/stable/api.html?highlight=options#errors-and-http-status-codes}
 */
export class DatabaseError extends Error {
  code: DatabaseErrorCode

  constructor(code: DatabaseErrorCode, message?: string) {
    super(message)
    this.name = 'DatabaseError'

    switch (message) {
      case NETWORK_MESSAGE:
        this.code = DatabaseErrorCode.NETWORK_ERROR
        break
      default:
        this.code = code
        break
    }
  }
}
