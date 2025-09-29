import { noop } from './noop'
import { sleep } from './sleep'

/**
 * Callback function that returns a promise, used for retrying operations.
 */
export type RetryCallback<T> = () => Promise<T>

/**
 * Options for the `retry` function.
 */
export interface RetryOptions {
  /**
   * Whether to log retry attempts.
   * @default true
   */
  logs?: boolean
  /**
   * Functions run at the end of the retry process.
   */
  onComplete?: <T>() => T
  /**
   * Functions run when an error occurs during the retry process.
   */
  onError?: (error: Error) => void
  /**
   * Functions run before each retry attempt.
   */
  onRetry?: (attempt: number) => void
  /**
   * Functions run when the retry operation succeeds.
   */
  onSuccess?: <R, T>(result: R) => T
  /**
   * Maximum number of retry attempts.
   * @default 5
   */
  retries?: number
  /**
   * Whether to throw an error if the retry limit is reached.
   * @default true
   */
  throwOnError?: boolean
  /**
   * Time to wait between retries in milliseconds.
   * @default 2000
   */
  timeout?: number
}

/**
 * Recursively calls a function until it succeeds or the retry limit is reached.
 */
export const retry = async <T>(callback: RetryCallback<T>, options?: RetryOptions) => _retry(callback, options)

const _retry = async <T>(callback: RetryCallback<T>, options?: RetryOptions, attempt = 1): Promise<T> => {
  const {
    logs = true,
    onComplete = noop,
    onError = noop,
    onRetry = noop,
    onSuccess = noop,
    retries = 5,
    throwOnError = true,
    timeout = 2000,
  } = options ?? {}

  onRetry(attempt)

  try {
    const result = await callback()
    onSuccess(result)
    onComplete()
    return result
  } catch (e) {
    const error = e as Error

    if (attempt < retries) {
      if (logs) console.warn(`Retrying in ${timeout}ms... (${attempt}/${retries})`)
      onError(error)
      await sleep(timeout)
      return _retry(callback, options, attempt + 1)
    }

    if (logs) console.error('Retry limit reached')
    onError(error)
    onComplete()
    if (throwOnError) throw e
    return Promise.reject(error)
  }
}
