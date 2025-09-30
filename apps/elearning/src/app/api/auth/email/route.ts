import { createApiClient } from '@/lib/api'
import { type AuthEmailInput, type EmailTemplate, Mailer, mailer } from '@glore/mailer'

export const POST = async (request: Request) => {
  const input = JSON.parse(await request.text()) as AuthEmailInput
  if (!input.user?.email) return Response.json('Invalid signature', { status: 401 })

  const template = `auth/${input.email_data.email_action_type}` as EmailTemplate
  if (!mailer.templates.includes(template))
    return Response.json({ error: 'Invalid email action type' }, { status: 400 })

  const { redirect_to, token, token_hash, token_new, token_hash_new } = input.email_data

  const api = await createApiClient()
  const user = await api.users.find(input.user.id)

  try {
    new Mailer().sendEmail(template, {
      to: input.user.email,
      redirectTo: redirect_to,
      token,
      tokenHash: token_hash,
      tokenNew: token_new,
      tokenHashNew: token_hash_new,
      locale: user?.locale ?? undefined,
    })
  } catch (e) {
    console.error(e)
    return Response.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
