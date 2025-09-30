import { type NextRequest } from 'next/server'

import { redirect } from '@/lib/navigation'
import { createCookieClient } from '@/lib/storage'
import { type AuthEmailAction } from '@glore/mailer'

const TOKEN_HASH_REGEX = /^pkce_[a-f0-9]{56}$/

export const GET = async ({ url }: NextRequest) => {
  const { setEncoded } = await createCookieClient()
  const { searchParams } = new URL(url)

  const token = searchParams.get('token_hash')
  const type = searchParams.get('type') as AuthEmailAction
  const loginToken = type === 'email' && token && TOKEN_HASH_REGEX.test(token) ? token : null

  await setEncoded('login-token', loginToken)

  redirect('/login')
}
