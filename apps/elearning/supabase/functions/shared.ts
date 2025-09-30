import { type Webhook } from 'standardwebhooks'

export const APP_URL = Deno.env.get('APP_URL') ?? 'http://localhost:3000'

export const fetchApi = async (path: string, options?: RequestInit) =>
  fetch(`${APP_URL}/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  })

fetchApi.post = (path: string, body: BodyInit, options?: Omit<RequestInit, 'method' | 'body'>) =>
  fetchApi(path, { method: 'POST', body: JSON.stringify(body), ...options })

export const signWebhook = (webhook: Webhook, payload: string, headers: Record<string, string>) => {
  const id = headers['webhook-id']
  const timestamp = headers['webhook-timestamp']
  const date = new Date(Number(timestamp) * 1000)
  const signature = webhook.sign(id, date, payload)
  headers['webhook-signature'] = signature
  return headers
}

export const response = (status: number, body?: Record<string, unknown>) =>
  new Response(body ? JSON.stringify(body) : null, {
    headers: {
      'Content-Type': 'application/json',
    },
    status,
  })

export const success = (message?: string, status = 200) => response(status, { message })

export const error = (init?: unknown, status = 500) => {
  const e = (typeof init === 'string' ? new Error(init) : init) as Error
  console.error(e)
  return response(status, { error: e.message ?? 'Internal Server Error' })
}
