import type { Any, AnyFunction } from './types'

/**
 * Creates a throttled version of a function that only invokes the callback
 * at most once every `limit` milliseconds.
 */
export const throttle = <F extends AnyFunction>(callback: F, limit: number): F => {
  let inThrottle: boolean
  let lastCallback: ReturnType<typeof setTimeout>
  let lastRun: number

  return function (this: Any, ...args: Any[]) {
    if (!inThrottle) {
      callback.apply(this, args)
      lastRun = Date.now()
      inThrottle = true
      return
    }
    clearTimeout(lastCallback)
    lastCallback = setTimeout(
      () => {
        if (Date.now() - lastRun >= limit) {
          callback.apply(this, args)
          lastRun = Date.now()
        }
      },
      limit - (Date.now() - lastRun)
    )
  } as F
}
