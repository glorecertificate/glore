import { type AnyObject, type HTTPUrl } from '@repo/utils'

import app from 'config/app.json'

/**
 * Application static routes.
 */
export enum Route {
  Home = '/',
  Login = '/login',
  Logout = '/logout',
  PasswordReset = '/password-reset',
  Modules = '/modules',
  Certificates = '/certificates',
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

/**
 * Application route with a dynamic segment.
 */
export type DynamicRoute = `${Route}/${string}`

/**
 * Application external routes.
 */
export const ExternalRoute = Object.freeze({
  App: app.url,
  Website: app.website,
})

/**
 * Generates a dynamic URL using the provided route and parameter.
 */
export const route = (route: Route, path?: number | string) => (path ? (`${route}/${path}` as DynamicRoute) : route)

/**
 * Generates an external URL using the provided route and optional path.
 */
export const externalRoute = (route: keyof typeof ExternalRoute, path?: string) => {
  const url = ExternalRoute[route]
  return (path ? `${url}/${path}` : url) as HTTPUrl
}

/**
 * Properties of a page component.
 */
export interface PageProps<T extends AnyObject = AnyObject, K extends AnyObject = AnyObject> {
  params: Promise<T>
  searchParams?: Promise<K>
}
