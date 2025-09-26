import { redirect as nextRedirect, type RedirectType } from 'next/navigation'
import { type AppRouteHandlerRoutes, type AppRoutes, type ParamsOf } from 'next/types/routes'

import { type HTTPUrl, type Replace } from '@repo/utils/types'

import { externalRoutes } from './config'

/**
 * Generates a URL path from a route.
 */
export const route = <R extends AppRoutes>(route: R, segments?: ParamsOf<R>, params?: Record<string, string>) => {
  const path =
    segments && Object.keys(segments as object).length > 0
      ? route.replace(/:([\w-]+)/g, (_, key) => segments[key as keyof ParamsOf<R>] as string)
      : route
  const searchParams = new URLSearchParams(params)
  const search = searchParams.toString()
  return (search ? `${path}?${search}` : path) as R
}

/**
 * Generates a URL path from an external URL.
 */
route.extenal = (
  key: keyof typeof externalRoutes,
  {
    params,
    path = '',
  }: {
    path?: string
    params?: URLSearchParams
  } = {},
) => {
  const url = `${externalRoutes[key]}${path}`
  const searchParams = params ? `?${params.toString()}` : ''
  return `${url}${searchParams}` as HTTPUrl
}

/**
 * Extends the Next.js `redirect` function to validate the argument.
 *
 * @see {@link https://nextjs.org/docs/app/api-reference/functions/redirect|Functions: redirect}
 */
export const redirect = (route: AppRoutes, type?: RedirectType): never => nextRedirect(route, type)

/**
 * Fetch function targeting the internal API.
 */
export const fetchApi = (route: Replace<AppRouteHandlerRoutes, '/api'>, options?: RequestInit) =>
  fetch(`/api${route}`, options)

/**
 * Generates a Google Maps URL for a given query.
 */
export const googleMaps = (query: string) => {
  const searchQuery = query.replace(/[^a-zA-Z0-9]+/g, '+').replace(/\++/g, '+')
  return `${externalRoutes.maps}/search/${searchQuery}` as `http${string}`
}
