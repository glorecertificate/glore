export enum PostgRESTCode {
  INVALID_CREDENTIALS = 'invalid_credentials',
  NETWORK_ERROR = 'NETWORK_ERROR',
  NO_RESULTS = 'PGRST116',
}

/**
 * Database error class using PostgREST codes.
 *
 * @see {@link https://postgrest.org/en/stable/api.html?highlight=options#errors-and-http-status-codes}
 */
export class DatabaseError extends Error {
  readonly code: PostgRESTCode

  constructor(code: PostgRESTCode, message?: string) {
    super(message)
    this.name = 'DatabaseError'

    switch (message) {
      case 'TypeError: Failed to fetch':
        this.code = PostgRESTCode.NETWORK_ERROR
        break
      default:
        this.code = code
        break
    }
  }
}
