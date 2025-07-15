/**
 * Throttles a function call to ensure it is not called more than once every specified delay.
 */
export const throttle = <T extends unknown[]>(callback: (...args: T) => void, delay: number) => {
  let isWaiting = false

  return (...args: T) => {
    if (isWaiting) return

    callback(...args)
    isWaiting = true

    setTimeout(() => {
      isWaiting = false
    }, delay)
  }
}

export default throttle
