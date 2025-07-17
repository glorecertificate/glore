import { type AnyFunction } from '@/types'

/**
 * Debounces a function call.
 */
export const debounce = <T extends AnyFunction>(callback: T, timeout: number) => {
  let timer: ReturnType<typeof setTimeout>

  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => callback(...args), timeout)
  }
}
