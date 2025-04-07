import { type AnyObject, type HTTPUrl, type PathParams } from '@repo/utils'

import { type ColorVariant } from '@/lib/theme'
import { getTranslations } from '@/services/i18n'
import app from 'config/app.json'

export enum Path {
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

export type Pathname = Path | `${Path}/${string}`

export const ExternalPath = {
  App: app.url,
  Website: app.website,
}

export interface Route {
  path: Path
  title?: string
  color?: ColorVariant
  icon?: string
  breadcrumb?: boolean
  sidebar?: boolean
}

export interface PageProps<P extends Path, K extends AnyObject = AnyObject> {
  params?: Promise<PathParams<P>>
  searchParams?: Promise<K>
}

export const getRoutes = async (): Promise<Route[]> => {
  const t = await getTranslations('Navigation')

  return [
    {
      title: t('dashboard'),
      path: Path.Home,
      icon: 'DashboardIcon',
      color: 'primary',
    },
    {
      title: t('modules'),
      path: Path.Modules,
      icon: 'BookOpenIcon',
      color: 'muted',
    },
    {
      path: Path.Module,
      color: 'muted',
    },
    {
      title: t('certificates'),
      path: Path.Certificates,
      icon: 'AwardIcon',
      color: 'muted',
    },
    {
      title: t('docs'),
      path: Path.Docs,
      icon: 'MessageCircleQuestionIcon',
      color: 'muted',
    },
    {
      title: t('docsIntro'),
      path: Path.DocsIntro,
    },
    {
      title: t('docsTutorials'),
      path: Path.DocsTutorials,
    },
    {
      title: t('docsFaq'),
      path: Path.DocsFaq,
    },
    {
      title: t('admin'),
      path: Path.Admin,
      icon: 'CogIcon',
      color: 'muted',
    },
    {
      title: t('settings'),
      path: Path.Settings,
      icon: 'SettingsIcon',
      sidebar: false,
    },
    {
      title: t('help'),
      path: Path.Help,
      icon: 'HelpCircleIcon',
      sidebar: false,
    },
  ]
}

export const buildPath = <P extends Path>(path: P, params?: PathParams<P>): Pathname =>
  params
    ? (path.replace(/:([a-zA-Z0-9_]+)/g, (_, key) => {
        const url = params[key as keyof PathParams<P>]
        return url as string
      }) as Pathname)
    : path

export const externalPath = (
  key: keyof typeof ExternalPath,
  options: {
    path?: string
    params?: URLSearchParams
  } = {},
) => {
  const url = ExternalPath[key]
  const pathPath = options.path ? `/${options.path}` : ''
  const searchParams = options.params ? `?${options.params.toString()}` : ''
  return `${url}${pathPath}${searchParams}` as HTTPUrl
}
