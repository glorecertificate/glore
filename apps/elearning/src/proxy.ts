'use server'

import { type NextProxy, type NextRequest, NextResponse, type ProxyConfig } from 'next/server'

import { getLocale } from 'next-intl/server'

import { decodeAsync } from '@glore/utils/encode'

import { getProxyDatabase } from '@/lib/data/server'
import { AuthRoute } from '@/lib/navigation'
import { cookieStore } from '@/lib/storage'

export const config: ProxyConfig = {
  matcher: [
    '/((?!_next/static|_next/image|api/|favicon.ico|sitemap.xml|robots.txt|manifest.json|.*.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

const verifyRequest = async (request: NextRequest) => {
  try {
    const userCookie = request.cookies.get(`${cookieStore.config.prefix ?? ''}user`)
    if (!userCookie?.value) throw new Error()
    const user = JSON.parse(await decodeAsync(userCookie.value))
    if (!user) throw new Error()
    return true
  } catch {
    const db = await getProxyDatabase(request)
    const { error } = await db.auth.getUser()
    return !error
  }
}

export const proxy: NextProxy = async request => {
  const isValid = await verifyRequest(request)
  const isAuthPath = Object.values(AuthRoute).some(route => request.nextUrl.pathname.startsWith(route))

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const locale = await getLocale()
  const lang = new URL(request.url).searchParams.get('lang')
  if (lang && lang !== locale) response.headers.append('Set-Cookie', `NEXT_LOCALE=${lang}`)

  try {
    if (isAuthPath) {
      return isValid ? NextResponse.redirect(new URL('/', request.url)) : response
    }
    return isValid ? response : NextResponse.redirect(new URL('/login', request.url))
  } catch {
    return response
  }
}
