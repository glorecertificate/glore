interface QueryResult<T> {
  data: T
  error: null
}

interface QueryError {
  data: null
  error: { code: string; message: string }
}

export type SafeQueryResult<T> = QueryResult<T> | QueryError

/** Wraps a database query in a try/catch and returns a response object `{ data, error }`. */
export const safeQuery = async <T>(queryFn: () => Promise<T>): Promise<SafeQueryResult<T>> => {
  try {
    const data = await queryFn()
    return { data, error: null }
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e))
    return {
      data: null,
      error: { code: 'QUERY_ERROR', message: error.message },
    }
  }
}

/** Normalizes an unknown error into a structured error object. */
export const queryError = (e: unknown) => {
  const error = e instanceof Error ? e : new Error(String(e))
  return {
    code: 'UNKNOWN',
    message: error.message,
  }
}
