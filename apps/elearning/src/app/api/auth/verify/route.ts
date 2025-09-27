import { type NextRequest } from 'next/server'

import { type EmailOtpType } from '@supabase/supabase-js'

import { redirect } from '@/lib/navigation'
import { setEncodedCookie } from '@/lib/storage/ssr'

const TOKEN_HASH_REGEX = /^pkce_[a-f0-9]{56}$/

export const GET = async ({ url }: NextRequest) => {
  const { searchParams } = new URL(url)

  const token = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType
  const loginToken = type === 'email' && token && TOKEN_HASH_REGEX.test(token) ? token : null

  await setEncodedCookie('login-token', loginToken)

  redirect('/login')
}
