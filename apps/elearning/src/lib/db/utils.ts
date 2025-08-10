export type DatabaseErrorCode = (typeof DATABASE_ERRORS)[keyof typeof DATABASE_ERRORS]['codes'][number]

const DATABASE_ERRORS = {
  INVALID_CREDENTIALS: {
    codes: ['INVALID_CREDENTIALS', 'invalid_credentials'],
    message: 'Invalid credentials',
  },
  NETWORK_ERROR: {
    codes: ['NETWORK_ERROR'],
    message: 'Network error',
  },
  NO_RESULTS: {
    codes: ['NO_RESULTS', 'PGRST116'],
    message: 'No results found',
  },
} as const

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
