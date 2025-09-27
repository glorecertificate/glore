'use server'

import { NextResponse } from 'next/server'

import { createDatabase } from '@/lib/db/ssr'

export const GET = async (request: Request) => {
  const { origin, searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const redirectTo = searchParams.get('redirect_to')?.toString()

  if (code) {
    const { auth } = await createDatabase()
    await auth.exchangeCodeForSession(code)
  }

  if (redirectTo) {
    return NextResponse.redirect(`${origin}${redirectTo}`)
  }

  return NextResponse.redirect(origin)
}
