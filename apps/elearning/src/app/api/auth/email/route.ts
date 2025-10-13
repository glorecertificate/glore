import { type Locale } from 'next-intl'

import { type EmailTemplate, mailerConfig, sendEmail } from '@glore/mailer'

import { type AuthEmailInput } from '@/lib/db'
import { createApiClient } from '@/lib/ssr'

export const POST = async (request: Request) => {
  const input = (await request.json()) as AuthEmailInput
  if (!input.user?.email) return Response.json('Invalid signature', { status: 401 })

  const template = `auth/${input.email_data.email_action_type}` as EmailTemplate
  if (!mailerConfig.templates.includes(template)) return Response.json('Invalid action', { status: 400 })

  let locale: Locale | undefined

  try {
    const api = await createApiClient()
    const user = await api.users.find(input.user.id)
    locale = user.locale ?? undefined
  } catch {}

  try {
    await sendEmail(template, {
      to: input.user.email,
      locale,
      redirectTo: input.email_data.redirect_to,
      token: input.email_data.token,
      tokenHash: input.email_data.token_hash,
      tokenNew: input.email_data.token_new,
      tokenHashNew: input.email_data.token_hash_new,
    })
  } catch (e) {
    console.error(e)
    return Response.json('Failed to send email', { status: 500 })
  }
}
