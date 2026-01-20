import { Webhook } from 'standardwebhooks'

const APP_URL = Deno.env.get('APP_URL')
const WH_SECRET = Deno.env.get('AUTH_EMAIL_HOOK_SECRET')

Deno.serve(async request => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  if (!APP_URL) return new Response('Missing APP_URL environment variable', { status: 500 })
  if (!WH_SECRET) return new Response('Missing AUTH_EMAIL_HOOK_SECRET environment variable', { status: 500 })

  const payload = await request.text()
  const requestHeaders = Object.fromEntries(request.headers)
  const webhook = new Webhook(WH_SECRET.replace('v1,whsec_', ''))
  const headers = { 'Content-Type': 'application/json' }

  try {
    const data = webhook.verify(payload, requestHeaders) as {
      email_data: {
        redirect_to: string
      }
    }
    const url = `${APP_URL}/api/v1/auth/email`

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    })
    const text = await response.text()
    let json: { error?: string }

    try {
      json = JSON.parse(text)
    } catch (e) {
      console.error(text)
      throw e
    }

    if (!response.ok) {
      console.error(`Error response from ${url}:`, json.error)
      return new Response(json.error, { status: response.status, headers })
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers })
  } catch (e) {
    console.error('Error verifying webhook', e)
    return new Response(JSON.stringify(e), { status: 401, headers })
  }
})
