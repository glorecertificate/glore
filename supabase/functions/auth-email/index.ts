import { Webhook } from 'standardwebhooks'

const HOOK_SECRET = Deno.env.get('AUTH_EMAIL_HOOK_SECRET')
const REDIRECT_URL = Deno.env.get('AUTH_EMAIL_REDIRECT_URL')

interface AuthEmailPayload {
  email_data: {
    redirect_to: string
  }
}

Deno.serve(async request => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  if (!HOOK_SECRET) return new Response('Missing AUTH_EMAIL_HOOK_SECRET environment variable', { status: 500 })
  if (!REDIRECT_URL) return new Response('Missing AUTH_EMAIL_REDIRECT_URL environment variable', { status: 500 })

  const requestPayload = await request.text()
  const requestHeaders = Object.fromEntries(request.headers)
  const webhook = new Webhook(HOOK_SECRET.replace('v1,whsec_', ''))
  const headers = { 'Content-Type': 'application/json' }

  try {
    const data = webhook.verify(requestPayload, requestHeaders) as AuthEmailPayload
    const body = JSON.stringify(data)

    const response = await fetch(REDIRECT_URL, { method: 'POST', headers, body })
    const text = await response.text()

    try {
      const json = JSON.parse(text)

      return response.ok
        ? new Response(JSON.stringify({ success: true }), { status: 200, headers })
        : new Response(json.error, { status: response.status, headers })
    } catch {
      return new Response(text, { status: response.status, headers })
    }
  } catch (e) {
    return new Response(JSON.stringify(e), { status: 401, headers })
  }
})
