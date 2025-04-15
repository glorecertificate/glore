import { type AnyRecord, type HTTPUrl } from '@repo/utils'

import metadata from 'config/metadata.json'

export interface PageProps<R extends Route, K extends AnyRecord = AnyRecord> {
  params?: Promise<RouteSegments<R>>
  searchParams?: Promise<K>
}

export enum Route {
  Home = '/',
  Login = '/login',
  Logout = '/logout',
  PasswordReset = '/password-reset',
  Modules = '/modules',
  Module = '/modules/:slug',
  Certificates = '/certificates',
  Certificate = '/certificates/:id',
  CertificatesNew = '/certificates/new',
  Docs = '/docs',
  DocsIntro = '/docs/intro',
  DocsTutorials = '/docs/tutorials',
  DocsFaq = '/docs/faq',
  Admin = '/admin',
  Settings = '/settings',
  Help = '/help',
  About = '/about',
}

export type Pathname = Route | `${Route}/${string}`

export type RouteSegments<S extends string> = S extends `${infer _}:${infer Param}/${infer Rest}`
  ? Record<Param | keyof RouteSegments<Rest>, string>
  : S extends `${infer _}:${infer Param}`
    ? Record<Param, string>
    : AnyRecord

export const ExternalUrl = {
  App: metadata.url,
  Website: metadata.website,
}

/**
 * Generates a URL path from a route appending optional search parameters.
 */
export const route = <R extends Route>(route: R, params?: Record<string, string>) => {
  const searchParams = new URLSearchParams(params)
  const search = searchParams.toString()
  return (search ? `${route}?${search}` : route) as Pathname
}

/**
 * Generates a URL path from a dynamic route by replacing the dynamic segments with the provided values and appending optional search parameters.
 */
export const dynamicRoute = <R extends Route>(dynamicRoute: R, segments: RouteSegments<R>, params?: Record<string, string>) => {
  const path = dynamicRoute.replace(/:([\w-]+)/g, (_, key) => segments[key as keyof RouteSegments<R>] as string)
  return route(path as Route, params)
}

/**
 * Generates a URL path from an external URL with optional path and search parameters.
 */
export const externalUrl = (
  key: keyof typeof ExternalUrl,
  options: {
    path?: string
    params?: URLSearchParams
  } = {},
) => {
  const url = ExternalUrl[key]
  const pathPath = options.path ? `/${options.path}` : ''
  const searchParams = options.params ? `?${options.params.toString()}` : ''
  return `${url}${pathPath}${searchParams}` as HTTPUrl
}
