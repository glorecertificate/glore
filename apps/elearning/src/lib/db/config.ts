/**
 * Common database errors mapped to custom error codes.
 */
export const DATABASE_ERRORS = {
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
 * Formatted timestamps for GraphQL queries.
 */
export const TIMESTAMPS = `
  createdAt:created_at,
  updatedAt:updated_at
`
