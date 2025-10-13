export const API_URL = Deno.env.get('API_URL') ?? Deno.env.get('API_PREVIEW_URL') ?? 'http://localhost:3000/api'

export const fetchApi = (path: `/${string}`, options?: RequestInit) =>
  fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
  })

fetchApi.post = <T>(path: `/${string}`, body: T, headers: HeadersInit = {}) =>
  fetchApi(path, { method: 'POST', body: JSON.stringify(body), headers })

export const success = (message?: string, status = 200) => Response.json({ message, success: true }, { status })

export const error = (error = 'Internal Server Error', status = 500) =>
  Response.json({ error, success: false }, { status })
