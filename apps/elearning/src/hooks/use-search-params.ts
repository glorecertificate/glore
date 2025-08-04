import { type NavigateOptions } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { useSearchParams as useNextSearchParams, useRouter } from 'next/navigation'
import { useCallback } from 'react'

import { usePathname } from '@/hooks/use-pathname'

/**
 * Custom hook to manage URL search parameters.
 *
 * Extends the functionality of `useSearchParams` to include methods to manipulate parameters.
 */
export const useSearchParams = () => {
  const { pathname } = usePathname()
  const router = useRouter()
  const searchParams = useNextSearchParams()

  const replaceSearchParams = useCallback(
    (
      params: URLSearchParams,
      options: NavigateOptions = {
        scroll: false,
      },
    ) => {
      const url = params.toString()
      router.replace(url ? `${pathname}?${url}` : pathname, options)
    },
    [pathname, router],
  )

  const setSearchParam = useCallback(
    (name: string, value: string, options?: NavigateOptions) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(name, value)
      replaceSearchParams(params, options)
    },
    [searchParams, replaceSearchParams],
  )

  const deleteSearchParam = useCallback(
    (name: string, options?: NavigateOptions) => {
      const params = new URLSearchParams(searchParams.toString())
      params.delete(name)
      replaceSearchParams(params, options)
    },
    [searchParams, replaceSearchParams],
  )

  return { searchParams, setSearchParam, deleteSearchParam, replaceSearchParams }
}
