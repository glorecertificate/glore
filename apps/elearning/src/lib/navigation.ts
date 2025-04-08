import { type AnyObject, type HTTPUrl } from '@repo/utils'

import app from 'config/app.json'

export interface PageProps<R extends Route, K extends AnyObject = AnyObject> {
  params?: Promise<RouteParams<R>>
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

export type RouteParams<S extends string> = S extends `${infer _}:${infer Param}/${infer Rest}`
  ? {
      [K in Param | keyof RouteParams<Rest>]: string
    }
  : S extends `${infer _}:${infer Param}`
    ? Record<Param, string>
    : AnyObject

export type Pathname = Route | `${Route}/${string}`

export const dynamicRoute = <R extends Route>(route: R, params: RouteParams<R>): Pathname =>
  route.replace(/:([\w-]+)/g, (_, key) => params[key as keyof RouteParams<R>] as string) as Pathname

export const ExternalUrl = {
  App: app.url,
  Website: app.website,
}

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
