import {
  AwardIcon,
  BookOpenIcon,
  CogIcon,
  HelpCircleIcon,
  MessageCircleQuestionIcon,
  SettingsIcon,
  type LucideIcon,
} from 'lucide-react'

import { type AnyObject, type HTTPUrl, type PathParams } from '@repo/utils'

import { DashboardIcon, type CustomIcon } from '@/components/ui/icons'
import { type ColorVariant } from '@/lib/theme'
import { type MessageKey } from '@/services/i18n'
import app from 'config/app.json'

export enum Route {
  Home = '/',
  Login = '/login',
  Logout = '/logout',
  PasswordReset = '/password-reset',
  Modules = '/modules',
  Module = '/modules/:slug',
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

export const route = <R extends Route>(route: R, params?: PathParams<R>) => {
  if (!params) return route

  return route.replace(/:([a-zA-Z0-9_]+)/g, (_, key) => {
    const url = params[key as keyof PathParams<R>]
    return url as string
  })
}

export const ExternalRoute = Object.freeze({
  App: app.url,
  Website: app.website,
})

export const externalRoute = (
  route: keyof typeof ExternalRoute,
  options: {
    path?: string
    params?: URLSearchParams
  } = {},
) => {
  const url = ExternalRoute[route]
  const pathPath = options.path ? `/${options.path}` : ''
  const searchParams = options.params ? `?${options.params.toString()}` : ''
  return `${url}${pathPath}${searchParams}` as HTTPUrl
}

export type Pathname = Route | `${Route}/${string}`

export interface SubPage {
  title?: string
  path: Route
  isActive?: boolean
}

export interface Page {
  title: string
  path: Route
  isActive?: boolean
  isActiveSection?: boolean
  subPages?: SubPage[]
  color?: ColorVariant
  icon?: LucideIcon | CustomIcon
}

export interface PageBase extends Omit<Page, 'title' | 'subPages'> {
  title: MessageKey
  subPages?: (Omit<SubPage, 'title'> & {
    title?: MessageKey
  })[]
}

export interface PageProps<T extends AnyObject, K extends AnyObject> {
  params?: Promise<T>
  searchParams?: Promise<K>
}

export interface Section {
  name?: string
  pages: Page[]
  sidebar?: boolean
  breadcrumbs?: boolean
}

export interface SectionUntranslated extends Omit<Section, 'name' | 'pages'> {
  name?: MessageKey
  pages: PageBase[]
}

export const sections: SectionUntranslated[] = [
  {
    name: 'Navigation.mainSection',
    sidebar: true,
    breadcrumbs: true,
    pages: [
      {
        title: 'Navigation.dashboard',
        path: Route.Home,
        icon: DashboardIcon,
      },
      {
        title: 'Navigation.modules',
        path: Route.Modules,
        icon: BookOpenIcon,
        color: 'muted',
        subPages: [
          {
            path: Route.Module,
          },
        ],
      },
      {
        title: 'Navigation.certificates',
        path: Route.Certificates,
        icon: AwardIcon,
        color: 'muted',
      },
      {
        title: 'Navigation.docs',
        path: Route.Docs,
        icon: MessageCircleQuestionIcon,
        color: 'muted',
        subPages: [
          {
            title: 'Navigation.docsIntro',
            path: Route.DocsIntro,
          },
          {
            title: 'Navigation.docsTutorials',
            path: Route.DocsTutorials,
          },
          {
            title: 'Navigation.docs',
            path: Route.DocsFaq,
          },
        ],
      },
      {
        title: 'Navigation.admin',
        path: Route.Admin,
        icon: CogIcon,
        color: 'muted',
      },
    ],
  },
  {
    name: 'Navigation.secondarySection',
    breadcrumbs: true,
    pages: [
      {
        title: 'Navigation.settings',
        path: Route.Settings,
        icon: SettingsIcon,
      },
      {
        title: 'Navigation.help',
        path: Route.Help,
        icon: HelpCircleIcon,
      },
    ],
  },
]
