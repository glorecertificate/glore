import { type AppRouteHandlerRoutes, type AppRoutes, type ParamsOf } from 'next/types/routes'

import { type Enum } from '@glore/utils/types'

export enum AuthRoute {
  Login = '/login',
}

export enum ExternalRoute {
  Maps = 'https://maps.google.com',
  Gmail = 'https://mail.google.com',
  Outlook = 'https://outlook.office.com/mail',
  AppleMail = 'message://',
}

export const apiRoute = <R extends AppRouteHandlerRoutes>(route: R) => route

export const route = <R extends AppRoutes, P = {}>(route: R, segments?: ParamsOf<R>, params?: P) => {
  if (!(segments || params)) return route

  const path =
    segments && Object.keys(segments as object).length > 0
      ? route.replace(/\[([\w-]+)\]/g, (_, key) => segments[key as keyof ParamsOf<R>] as string)
      : route

  const search = params ? new URLSearchParams(params).toString() : ''
  return (search ? `${path}?${search}` : path) as R
}

export const mapsUrl = (query: string) => {
  const searchQuery = query.replace(/[^a-zA-Z0-9]+/g, '+').replace(/\++/g, '+')
  return `${ExternalRoute.Maps}/search/${searchQuery}` as ExternalRoute
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

export enum CourseMode {
  Editor = 'editor',
  Preview = 'preview',
  Student = 'student',
}
