import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useContext, useMemo } from 'react'

import { NavigationContext } from '@/components/providers/navigation-provider'
import { redirect } from '@/lib/navigation'

export interface AppRouter extends ReturnType<typeof useRouter> {
  /**
   * Navigate to the provided href and pushes a new history entry.
   */
  push(href: string, options?: { scroll?: boolean }): void
  /**
   * Navigate to the provided href replacing the current history entry.
   */
  replace(href: string, options?: { scroll?: boolean }): void
  /**
   * Prefetch the provided href.
   */
  prefetch(
    href: string,
    options?: {
      kind: 'auto' | 'full' | 'temporary'
      onInvalidate?: () => void
    }
  ): void
}

export interface UseNavigationOptions<T extends Record<string, string>> {
  searchParams?: T
}

/**
 * Extends the default `useNavigation` hook to provide type-safe access to
 * the application routes and allow optimistic UI updates.
 */
export const useNavigation = <T extends Record<string, string>>(_?: UseNavigationOptions<T>) => {
  const context = useContext(NavigationContext)
  if (!context) throw new Error('useNavigation must be used within a NavigationProvider')

  const router = useRouter() as AppRouter
  const nextSearchParams = useSearchParams()
  const isLoading = useMemo(() => context.pathname !== context.uiPathname, [context.pathname, context.uiPathname])

  const searchParams = useMemo(() => {
    const params = new URLSearchParams()
    for (const [key, value] of nextSearchParams.entries()) {
      params.append(key, value)
    }
    return params
  }, [nextSearchParams])

  const getSearchParam = useCallback(
    <K extends keyof T>(name: K): T[K] | undefined => {
      const value = searchParams.get(String(name))
      if (value === null) return
      return value as T[K]
    },
    [searchParams]
  )

  const hasSearchParam = useCallback(<K extends keyof T>(name: K) => !!getSearchParam(name), [getSearchParam])

  const setSearchParam = useCallback(
    <K extends keyof T>(name: K, value: T[K]) => {
      searchParams.set(String(name), String(value))
      router.replace(`?${searchParams}`, { scroll: false })
    },
    [router, searchParams]
  )

  const deleteSearchParam = useCallback(
    (name: keyof T) => {
      if (!hasSearchParam(name)) return
      searchParams.delete(String(name))
      router.replace(`?${searchParams}`, { scroll: false })
    },
    [hasSearchParam, router, searchParams]
  )

  return {
    ...context,
    /**
     * Extend the Next.js router to provide type-safe access to the application routes.
     *
     * @see {@link https://nextjs.org/docs/app/api-reference/navigation/use-router|Hook: useRouter}
     */
    router,
    /**
     * Extends the Next.js `redirect` function to validate the argument.
     *
     * @see {@link https://nextjs.org/docs/app/api-reference/functions/redirect|Functions: redirect}
     */
    redirect,
    /**
     * Indicates whether the navigation is in progress.
     */
    isLoading,
    /**
     * Extended search params with type-safe getters and setters.
     *
     * @see {@link https://nextjs.org/docs/app/api-reference/functions/use-search-params|Functions: useSearchParams}
     */
    searchParams: {
      ...searchParams,
      get: getSearchParam,
      has: hasSearchParam,
      set: setSearchParam,
      delete: deleteSearchParam,
    },
  }
}
