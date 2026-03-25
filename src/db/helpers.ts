interface QueryResult<T> {
  data: T
  error: null
}

interface QueryError {
  data: null
  error: { code: string; message: string }
}

export type SafeQueryResult<T> = QueryResult<T> | QueryError

const classifyError = (error: Error): string => {
  const msg = error.message.toLowerCase()
  if (msg.includes('not found') || msg.includes('no rows')) return 'NOT_FOUND'
  if (msg.includes('unique') || msg.includes('duplicate') || msg.includes('already exists')) return 'CONFLICT'
  if (msg.includes('foreign key') || msg.includes('violates')) return 'CONSTRAINT_VIOLATION'
  if (msg.includes('permission') || msg.includes('unauthorized') || msg.includes('not authenticated')) {
    return 'UNAUTHORIZED'
  }
  if (msg.includes('timeout') || msg.includes('timed out')) return 'TIMEOUT'
  if (msg.includes('connection')) return 'CONNECTION_ERROR'
  return 'QUERY_ERROR'
}

export const safeQuery = async <T>(queryFn: () => Promise<T>): Promise<SafeQueryResult<T>> => {
  try {
    const data = await queryFn()
    return { data, error: null }
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e))
    return {
      data: null,
      error: { code: classifyError(error), message: error.message },
    }
  }
}

export const queryError = (e: unknown) => {
  const error = e instanceof Error ? e : new Error(String(e))
  return {
    code: classifyError(error),
    message: error.message,
  }
}
