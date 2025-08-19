import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useMemo } from 'react'

/**
 * Custom hook to manage URL query parameters.
 *
 * Extends the functionality of `useSearchParams` to provide type-safe getters and setters.
 */
export const useQueryParams = <T extends Record<string, string | number | boolean>>() => {
  const searchParams = useSearchParams()
  const router = useRouter()

  const queryParams = useMemo(() => {
    const query = new URLSearchParams()
    for (const [key, value] of searchParams.entries()) {
      query.append(key, value)
    }
    return query
  }, [searchParams])

  const getQueryParam = useCallback(
    <K extends keyof T>(name: K): T[K] | undefined => {
      const value = queryParams.get(String(name))
      if (value === null) return undefined
      return value as T[K]
    },
    [queryParams],
  )

  const setQueryParam = useCallback(
    <K extends keyof T>(name: K, value: T[K]) => {
      queryParams.set(String(name), String(value))
      router.replace(`?${queryParams}`, { scroll: false })
    },
    [queryParams, router],
  )

  const deleteQueryParam = useCallback(
    (name: keyof T) => {
      queryParams.delete(String(name))
      router.replace(`?${queryParams}`, { scroll: false })
    },
    [queryParams, router],
  )

  return {
    queryParams,
    getQueryParam,
    setQueryParam,
    deleteQueryParam,
  }
}
