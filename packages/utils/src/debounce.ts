/**
 * Debounces a function by the specified delay (default is 500ms).
 */
export const debounce = <T>(callback: (...args: T[]) => void, delay = 500) => {
  let timer: ReturnType<typeof setTimeout>

  return (...args: T[]) => {
    clearTimeout(timer)

    timer = setTimeout(() => {
      callback(...args)
    }, delay)
  }
}
