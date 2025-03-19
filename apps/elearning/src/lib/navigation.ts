/**
 * Application static routes.
 */
export enum Route {
  Home = '/',
  Login = '/login',
  Logout = '/logout',
  Signup = '/signup',
  ResetPassword = '/reset-password',
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
