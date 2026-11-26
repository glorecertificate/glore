import 'server-only'

import { type NextProxy, type NextRequest, NextResponse, type ProxyConfig } from 'next/server'

import { type Locale } from 'next-intl'

import { auth } from '@/lib/auth'
import {
  APP_ROOT,
  AUTH_ROOT,
  DASHBOARD_ROOTS,
  INVITE_ROOT,
  JOIN_LINK_ROOT,
  JOIN_ROOT,
  LEGAL_ROOTS,
  LOCALE_PARAM,
  ONBOARDING_ROOT,
  ORGANIZATION_PARAM,
  REGISTER_ROOT,
  SESSION_ROOT,
  VERIFY_ROOT,
} from '@/lib/constants'
import { COOKIE_OPTIONS, prefixCookieName } from '@/lib/cookies'
import { LOCALES, LOCALE_COOKIE } from '@/lib/i18n'
import { safeNextPath } from '@/lib/next-path'
import { isReservedUsername } from '@/lib/username'

export const config: ProxyConfig = {
  matcher: [
    '/((?!_next/static|_next/image|api/|favicon.ico|sitemap.xml|robots.txt|manifest.json|sw.js|offline|.*.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

const ORGANIZATION_ID = /^\d+$/u
const PROFILE_PATH = /^\/@([a-zA-Z0-9.]+)(\/opengraph-image[\w-]*)?$/u
const PROFILE_INTERNAL_PATH = /^\/u\/([a-zA-Z0-9.]+)$/u
const PROFILE_IMAGE_PATH = /^\/u\/[a-zA-Z0-9.]+\/opengraph-image[\w-]*$/u
const LEGACY_PROFILE_PATH = /^\/([a-zA-Z0-9.]+)$/u

const profileResponse = (request: NextRequest) => {
  const { nextUrl, url } = request
  const { pathname, searchParams } = nextUrl

  const internal = PROFILE_INTERNAL_PATH.exec(pathname)
  if (internal) return NextResponse.redirect(new URL(`/@${internal[1]}`, url), 308)

  const profile = PROFILE_PATH.exec(pathname)
  if (profile) return NextResponse.rewrite(new URL(`/u/${profile[1]}${profile[2] ?? ''}${nextUrl.search}`, url))

  const legacy = LEGACY_PROFILE_PATH.exec(pathname)
  if (!legacy || !searchParams.has('v') || isReservedUsername(legacy[1] ?? '')) return null
  return NextResponse.rewrite(new URL(`/u/${legacy[1]}/legacy${nextUrl.search}`, url))
}

const isPublicPath = (pathname: string) =>
  pathname === AUTH_ROOT ||
  pathname === REGISTER_ROOT ||
  (LEGAL_ROOTS as readonly string[]).includes(pathname) ||
  pathname.startsWith(JOIN_ROOT) ||
  pathname.startsWith(`${INVITE_ROOT}/`) ||
  pathname.startsWith(`${JOIN_LINK_ROOT}/`) ||
  pathname === VERIFY_ROOT ||
  pathname.startsWith(`${VERIFY_ROOT}/`) ||
  PROFILE_IMAGE_PATH.test(pathname) ||
  (!DASHBOARD_ROOTS.some(root => pathname.startsWith(root)) && /^\/[a-zA-Z0-9.]+$/u.test(pathname))

const returnPath = (request: NextRequest) => {
  if (request.method !== 'GET') return null
  const next = safeNextPath(`${request.nextUrl.pathname}${request.nextUrl.search}`)
  return next === '/' || next === APP_ROOT ? null : next
}

const expireSession = (request: NextRequest, { returnTo = false }: { returnTo?: boolean } = {}) => {
  const url = new URL(AUTH_ROOT, request.url)
  if (request.headers.get('cookie')?.includes('session_token')) {
    url.searchParams.set('expired', 'true')
  }
  const next = returnTo ? returnPath(request) : null
  if (next) url.searchParams.set('next', next)
  return NextResponse.redirect(url)
}

const revokeSession = (request: NextRequest) => {
  const url = new URL(SESSION_ROOT, request.url)
  const next = returnPath(request)
  if (next) url.searchParams.set('next', next)
  return NextResponse.redirect(url)
}

const restoreCourseListParams = (request: NextRequest) => {
  const { cookies, headers, nextUrl, url } = request
  if (request.method !== 'GET' || nextUrl.pathname !== '/courses' || nextUrl.search || headers.has('rsc')) return null
  const params = cookies.get(prefixCookieName('courseListParams'))?.value
  if (!params) return null
  const target = new URL(nextUrl.pathname, url)
  target.search = params
  if (!target.search) return null
  return NextResponse.redirect(target)
}

const applyOrganizationParam = ({ cookies, method, nextUrl }: NextRequest) => {
  const id = nextUrl.searchParams.get(ORGANIZATION_PARAM)
  if (method !== 'GET' || nextUrl.pathname !== APP_ROOT || !id || !ORGANIZATION_ID.test(id)) return
  cookies.set(prefixCookieName('org'), id)
}

const applyLocaleParam = ({ cookies, method, nextUrl }: NextRequest) => {
  const locale = nextUrl.searchParams.get(LOCALE_PARAM)
  if (method !== 'GET' || !locale || !LOCALES.includes(locale as Locale) || cookies.has(LOCALE_COOKIE)) return null
  cookies.set(LOCALE_COOKIE, locale)
  return locale
}

export const proxy: NextProxy = async request => {
  const { headers, nextUrl } = request
  const profile = profileResponse(request)
  if (profile) return profile

  applyOrganizationParam(request)
  const locale = applyLocaleParam(request)
  const response = NextResponse.next({ request: { headers } })
  if (locale) response.cookies.set(LOCALE_COOKIE, locale, COOKIE_OPTIONS)
  const isPublic = isPublicPath(nextUrl.pathname)
  const isOnboarding = nextUrl.pathname.startsWith(ONBOARDING_ROOT)

  try {
    const session = await auth.api.getSession({ headers })

    if (!session?.user) return isPublic ? response : expireSession(request, { returnTo: true })
    if (session.user.banned) return revokeSession(request)
    if (nextUrl.pathname === AUTH_ROOT) {
      return NextResponse.redirect(new URL(safeNextPath(nextUrl.searchParams.get('next')) ?? APP_ROOT, request.url))
    }
    if (!(session.user.onboardedAt || isOnboarding)) return NextResponse.redirect(new URL(ONBOARDING_ROOT, request.url))
    if (session.user.onboardedAt && isOnboarding) return NextResponse.redirect(new URL(APP_ROOT, request.url))

    return restoreCourseListParams(request) ?? response
  } catch {
    if (isPublic) return response
    return expireSession(request, { returnTo: true })
  }
}
