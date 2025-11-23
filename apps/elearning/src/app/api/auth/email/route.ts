import { type NextRequest, NextResponse } from 'next/server'

import { type Locale } from 'next-intl'

import { type AuthEmailInput } from '@/lib/data'
import { findUser } from '@/lib/data/server'
import { EmailTemplate, sendEmail } from '@/lib/services/mailer'

export const POST = async (request: NextRequest) => {
  const input = (await request.json()) as AuthEmailInput
  if (!input.user?.email) return NextResponse.json('Invalid signature', { status: 401 })

  const template = `auth/${input.email_data.email_action_type}` as EmailTemplate
  if (!Object.values(EmailTemplate).includes(template)) return NextResponse.json('Invalid action', { status: 400 })

  let locale: Locale | undefined
  let username: string | undefined

  const redirectUrl = new URL(input.email_data.redirect_to)
  const redirectLocale = redirectUrl.searchParams.get('locale') as Locale | null
  redirectUrl.searchParams.delete('locale')

  try {
    const user = await findUser(input.user.id)
    locale = user.locale ?? redirectLocale ?? undefined
    username = user.first_name ?? (user.username ? `@${user.username}` : undefined)
  } catch {}

  try {
    await sendEmail(template, {
      to: input.user.email,
      locale,
      username,
      redirectTo: redirectUrl.toString(),
      token: input.email_data.token,
      tokenHash: input.email_data.token_hash,
      tokenNew: input.email_data.token_new,
      tokenHashNew: input.email_data.token_hash_new,
    })

    return NextResponse.json('Email sent', { status: 200 })
  } catch (e) {
    console.error(e)
    return NextResponse.json('Failed to send email', { status: 500 })
  }
}
