import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import { Webhook } from 'standardwebhooks'

import { error, fetchApi, success } from '../shared.ts'

const HOOK_SECRET = Deno.env.get('AUTH_EMAIL_HOOK_SECRET')

if (!HOOK_SECRET) throw new Error('Missing AUTH_EMAIL_HOOK_SECRET')

const hookSecret = HOOK_SECRET.replace(/^v1,whsec_/, '')
const webhook = new Webhook(hookSecret)

Deno.serve(async request => {
  if (request.method !== 'POST') return error('Method not allowed', 405)

  const payload = await request.text()
  const headers = Object.fromEntries(request.headers)

  // if (!headers['webhook-id']) {
  //   const id = headers['webhook-id']
  //   const date = new Date(Number(headers['webhook-timestamp']) * 1000)
  //   headers['webhook-signature'] = webhook.sign(id, date, payload)
  // }

  try {
    const data = webhook.verify(payload, headers)
    const response = await fetchApi.post('/auth/email', JSON.stringify(data))
    if (!response.ok) return error('Failed to process request', response.status)

    return success('Email sent', 200)
  } catch (e) {
    console.error(e)
    return error(e)
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/auth-email' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
