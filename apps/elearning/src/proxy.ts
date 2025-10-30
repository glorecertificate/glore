'use server'

import { type NextProxy, type NextRequest, NextResponse, type ProxyConfig } from 'next/server'

import { getLocale } from 'next-intl/server'

import { decodeAsync } from '@glore/utils/encode'

import { getProxyDatabase } from '@/lib/data/server'
import { AuthRoute } from '@/lib/navigation'
import { cookies } from '@/lib/storage'

export const config: ProxyConfig = {
  matcher: [
    '/((?!_next/static|_next/image|api/|favicon.ico|sitemap.xml|robots.txt|manifest.json|.*.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

export const proxy: NextProxy = async request => {
  const isValid = await verifyRequest(request)

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  try {
    await setLocale(request, response)

    if (!isValid) {
      return isAuthPath(request) ? response : NextResponse.redirect(new URL('/login', request.url))
    }

    return isAuthPath(request) ? NextResponse.redirect(new URL('/', request.url)) : response
  } catch {
    return response
  }
}

const verifyRequest = async (request: NextRequest) => {
  try {
    const userCookie = request.cookies.get(`${cookies.config.prefix ?? ''}user`)
    const user = JSON.parse(await decodeAsync(userCookie?.value ?? 'null'))
    if (!user) throw Error
    return true
  } catch {
    const db = await getProxyDatabase(request)
    const { error } = await db.auth.getUser()
    if (error) return false
    return true
  }
}

const isAuthPath = (request: NextRequest) =>
  Object.values(AuthRoute).some(route => request.nextUrl.pathname.startsWith(route))

const setLocale = async (request: NextRequest, response: NextResponse) => {
  const locale = await getLocale()
  const lang = new URL(request.url).searchParams.get('lang')
  if (lang && lang !== locale) response.headers.append('Set-Cookie', `NEXT_LOCALE=${lang}`)
}
