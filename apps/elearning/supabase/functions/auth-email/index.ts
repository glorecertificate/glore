// @ts-expect-error
import { Webhook } from 'npm:standardwebhooks@1.0.0'

const API_URL = Deno.env.get('API_URL') ?? Deno.env.get('API_PREVIEW_URL')
const hookSecret = Deno.env.get('AUTH_EMAIL_HOOK_SECRET')!.replace('v1,whsec_', '')

Deno.serve(async request => {
  if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  const payload = await request.text()
  const requestHeaders = Object.fromEntries(request.headers)
  const webhook = new Webhook(hookSecret)
  let data: unknown

  const headers = new Headers()
  headers.set('Content-Type', 'application/json')

  try {
    data = webhook.verify(payload, requestHeaders)
  } catch (error) {
    console.error('Error verifying webhook', error)
    return new Response(JSON.stringify(error), { status: 401, headers })
  }

  try {
    await fetch(`${API_URL}/auth/email`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    })
  } catch (error) {
    console.error('Error forwarding to API', error)
    return new Response(JSON.stringify(error), { status: 500, headers })
  }

  return new Response(JSON.stringify({}), { status: 200, headers })
})
