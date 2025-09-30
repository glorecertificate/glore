import { redirect as nextRedirect, type RedirectType } from 'next/navigation'
import { type AppRouteHandlerRoutes, type AppRoutes, type LayoutRoutes, type ParamsOf } from 'next/types/routes'

import metadata from '@config/metadata'
import { type Enum, type HTTPUrl, type MailToUrl, type MessageUrl, type Replace, type TelUrl } from '@glore/utils/types'

export type Routes = AppRoutes | LayoutRoutes | AppRouteHandlerRoutes
export type ExternalUrl = HTTPUrl | MailToUrl | MessageUrl | TelUrl
export type AnyUrl = Routes | ExternalUrl

export const authRoutes = ['/login'] as const

export const externalRoutes = {
  app: metadata.url,
  www: metadata.website,
  maps: 'https://maps.google.com',
  gmail: 'https://mail.google.com',
  outlook: 'https://outlook.office.com/mail',
  appleMail: 'message://',
} as const

/**
 * Generates a URL path from a route.
 */
export const route = <R extends AppRoutes>(route: R, segments?: ParamsOf<R>, params?: Record<string, string>) => {
  const path =
    segments && Object.keys(segments as object).length > 0
      ? route.replace(/\[([\w-]+)\]/g, (_, key) => segments[key as keyof ParamsOf<R>] as string)
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
  } = {}
) => {
  const url = `${externalRoutes[key]}${path}`
  const searchParams = params ? `?${params.toString()}` : ''
  return `${url}${searchParams}` as HTTPUrl
}

/**
 * Extends the Next.js `redirect` function to validate the route argument.
 * @see {@link https://nextjs.org/docs/app/api-reference/functions/redirect|Functions: redirect}
 */
export const redirect = (route: AppRoutes, type?: RedirectType): never => nextRedirect(route, type)

/**
 * Fetches an internal API endpoint.
 */
export const fetchApi = (route: Replace<AppRouteHandlerRoutes, '/api'>, options?: RequestInit) =>
  fetch(`/api${route}`, options)

/**
 * Generates a Google Maps URL for a given query.
 */
export const maps = (query: string) => {
  const searchQuery = query.replace(/[^a-zA-Z0-9]+/g, '+').replace(/\++/g, '+')
  return `${externalRoutes.maps}/search/${searchQuery}` as `http${string}`
}

export enum AuthView {
  Login = 'login',
  PasswordRequest = 'password_request',
  EmailSent = 'email_sent',
  PasswordReset = 'password_reset',
  PasswordUpdated = 'password_updated',
  InvalidToken = 'invalid_token',
  InvalidPasswordReset = 'invalid_password_reset',
}

export enum CourseListEditorView {
  All = 'all',
  Published = 'published',
  Partial = 'partial',
  Draft = 'draft',
  Archived = 'archived',
}

export enum CourseListLearnerView {
  All = 'all',
  NotStarted = 'not_started',
  InProgress = 'in_progress',
  Completed = 'completed',
}

export type CourseListView = Enum<CourseListEditorView | CourseListLearnerView>
