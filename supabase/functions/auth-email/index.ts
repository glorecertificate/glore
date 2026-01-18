import { Webhook } from 'standardwebhooks'

const WH_SECRET = Deno.env.get('AUTH_EMAIL_HOOK_SECRET')
const LOCAL_TUNNEL_URL = Deno.env.get('LOCAL_TUNNEL_URL')

Deno.serve(async request => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  if (!WH_SECRET) return new Response('Missing webhook secret', { status: 500 })

  const payload = await request.text()
  const requestHeaders = Object.fromEntries(request.headers)
  const hookSecret = WH_SECRET.replace('v1,whsec_', '')
  const webhook = new Webhook(hookSecret)
  const headers = new Headers()
  headers.set('Content-Type', 'application/json')

  try {
    const data = webhook.verify(payload, requestHeaders) as { email_data: { redirect_to: string } }
    const isDevelopment = new URL(data.email_data.redirect_to).hostname === 'localhost'

    const appUrl = isDevelopment ? LOCAL_TUNNEL_URL : new URL(data.email_data.redirect_to).origin
    if (isDevelopment) headers.set('Bypass-Tunnel-Reminder', 'true')

    try {
      await fetch(`${appUrl}/api/v1/auth/email`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      })
    } catch (e) {
      console.error('Error forwarding request to API:', e)
      return new Response(JSON.stringify(e), { status: 500, headers })
    }
  } catch (e) {
    console.error('Error verifying webhook', e)
    return new Response(JSON.stringify(e), { status: 401, headers })
  }

  return new Response(JSON.stringify({ status: 'ok' }), { status: 200, headers })
})
