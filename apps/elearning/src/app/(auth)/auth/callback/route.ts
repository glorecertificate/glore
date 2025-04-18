'use server'

import { NextResponse } from 'next/server'

import { createDatabaseClient } from '@/lib/db/server'

export const GET = async (request: Request) => {
  const { origin, searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const redirectTo = searchParams.get('redirect_to')?.toString()

  if (code) {
    const { auth } = await createDatabaseClient()
    await auth.exchangeCodeForSession(code)
  }

  if (redirectTo) {
    return NextResponse.redirect(`${origin}${redirectTo}`)
  }

  return NextResponse.redirect(origin)
}
