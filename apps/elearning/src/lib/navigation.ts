import { type AnyObject } from '@repo/utils'

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
 * Generates a dynamic URL using the provided route and parameter.
 */
export const dynamicRoute = (route: Route, param: number | string) => `${route}/${param}` as `${Route}/${string}`

/**
 * Properties of a page component.
 */
export interface PageProps<T extends AnyObject = AnyObject, K extends AnyObject = AnyObject> {
  params: Promise<T>
  searchParams?: Promise<K>
}
