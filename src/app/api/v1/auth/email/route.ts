import { type NextRequest, NextResponse } from 'next/server'

import { type Locale } from 'next-intl'

import { sendEmail } from '@/actions/email'
import { findUser } from '@/actions/user'
import { type DatabaseHookPayload } from '@/db/types'
import { type EmailTemplate } from '@/email/types'

export const POST = async (request: NextRequest) => {
  const input = (await request.json()) as DatabaseHookPayload
  if (!input.user?.email) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })

  const template = `auth/${input.email_data.email_action_type}` as EmailTemplate
  let locale: Locale | undefined
  let username: string | undefined

  try {
    const user = await findUser(input.user.id)
    locale = user.locale ?? undefined
    username = user.first_name ?? (user.username ? `@${user.username}` : undefined)
  } catch {}

  try {
    await sendEmail(template, {
      to: input.user.email,
      locale,
      username,
      data: input.email_data,
    })
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
