import { unstable_rethrow } from 'next/navigation'

const errorCode = (error: Error) => {
  const message = error.message.toLowerCase()
  if (message.includes('not found') || message.includes('no rows')) return 'NOT_FOUND'
  if (message.includes('unique') || message.includes('duplicate') || message.includes('already exists')) {
    return 'CONFLICT'
  }
  if (message.includes('foreign key') || message.includes('violates')) return 'CONSTRAINT_VIOLATION'
  if (message.includes('permission') || message.includes('unauthorized') || message.includes('not authenticated')) {
    return 'UNAUTHORIZED'
  }
  if (message.includes('timeout') || message.includes('timed out')) return 'TIMEOUT'
  if (message.includes('connection')) return 'CONNECTION_ERROR'
  return 'QUERY_ERROR'
}

export const safeQuery = async <T>(query: () => Promise<T>) => {
  try {
    const data = await query()
    return { data, error: null }
  } catch (e) {
    unstable_rethrow(e)
    const error = e instanceof Error ? e : new Error(String(e))
    return {
      data: null,
      error: {
        code: errorCode(error),
        message: error.message,
      },
    }
  }
}

export const queryError = (e: unknown) => {
  unstable_rethrow(e)
  const error = e instanceof Error ? e : new Error(String(e))
  return {
    code: errorCode(error),
    message: error.message,
  }
}
