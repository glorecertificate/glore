import { redirect as nextRedirect, type RedirectType } from 'next/navigation'

import metadata from '@config/metadata'
import { type Enum, type HTTPUrl, type MailToUrl, type MessageUrl, type TelUrl } from '@glore/utils/types'

import { type AppRouteHandlerRoutes, type AppRoutes, type LayoutRoutes, type ParamsOf } from '../../.next/types/routes'

export type { AppRoutes, LayoutRoutes }
export type ApiRoutes = AppRouteHandlerRoutes
export type Routes = LayoutRoutes | AppRoutes | ApiRoutes

export type ExternalUrl = HTTPUrl | MailToUrl | MessageUrl | TelUrl
export type AnyUrl = Routes | ExternalUrl

export const APP_URL = process.env.APP_URL ?? metadata.url

export const AUTH_ROUTES = ['/login'] as const

export const EXTERNAL_ROUTES = {
  app: metadata.url,
  www: metadata.website,
  maps: 'https://maps.google.com',
  gmail: 'https://mail.google.com',
  outlook: 'https://outlook.office.com/mail',
  'apple-mail': 'message://',
} as const

export const route = <R extends AppRoutes>(route: R) => route

export const apiRoute = <R extends AppRouteHandlerRoutes>(route: R) => route

export const buildRoute = <R extends AppRoutes>(route: R, segments?: ParamsOf<R>, params?: Record<string, string>) => {
  const path =
    segments && Object.keys(segments as object).length > 0
      ? route.replace(/\[([\w-]+)\]/g, (_, key) => segments[key as keyof ParamsOf<R>] as string)
      : route
  const searchParams = new URLSearchParams(params)
  const search = searchParams.toString()
  return (search ? `${path}?${search}` : path) as R
}

export const buildExternalRoute = (
  key: keyof typeof EXTERNAL_ROUTES,
  {
    params,
    path = '',
  }: {
    path?: string
    params?: URLSearchParams
  } = {}
) => {
  const url = `${EXTERNAL_ROUTES[key]}${path}`
  const searchParams = params ? `?${params.toString()}` : ''
  return `${url}${searchParams}` as HTTPUrl
}

/**
 * Extends the Next.js `redirect` function to validate the route and append optional query parameters.
 * @see {@link https://nextjs.org/docs/app/api-reference/functions/redirect|Functions: redirect}
 */
export const redirect = (route: AppRoutes, searchParams?: Record<string, string>, type?: RedirectType) => {
  const params = searchParams ? `?${searchParams.toString()}` : ''
  const url = `${route}${params}`
  return nextRedirect(url, type)
}

/**
 * Generates a Google Maps URL for a given query.
 */
export const googleMapsUrl = (query: string) => {
  const searchQuery = query.replace(/[^a-zA-Z0-9]+/g, '+').replace(/\++/g, '+')
  return `${EXTERNAL_ROUTES.maps}/search/${searchQuery}` as `http${string}`
}

export const COURSE_TABS = ['info', 'editor', 'preview'] as const

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

export type CourseTab = (typeof COURSE_TABS)[number]
