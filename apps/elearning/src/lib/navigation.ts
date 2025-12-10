import type { AppRouteHandlerRoutes, AppRoutes, ParamsOf } from 'next/types/routes'

export enum AuthRoute {
  Login = '/login',
}

export const route = <R extends AppRoutes | AppRouteHandlerRoutes, P = {}>(
  route: R,
  options?: ParamsOf<R> & Partial<P>
) => {
  if (Object.keys(options ?? {}).length === 0) return route

  const segmentKeys = Array.from(route.matchAll(/\[([\w-]+)\]/g)).map(match => match[1])
  const paramKeys = Object.keys(options ?? {}).filter(key => !segmentKeys.includes(key))

  // const path = hasOptions
  //   ? route.replace(/\[([\w-]+)\]/g, (_, key) => segments[key as keyof typeof segments] as string)
  //   : route
  const path =
    segmentKeys.length > 0
      ? route.replace(/\[([\w-]+)\]/g, (_, key) => (options as Record<string, string>)[key] as string)
      : route
  const searchParams =
    paramKeys.length > 0
      ? paramKeys.reduce(
          (params, key) => {
            const value = (options as Record<string, string | number | boolean>)[key]
            if (value !== undefined) {
              params[key] = String(value)
            }
            return params
          },
          {} as Record<string, string>
        )
      : null

  return `${path}?${searchParams ? `?${new URLSearchParams(searchParams).toString()}` : ''}` as R
}
