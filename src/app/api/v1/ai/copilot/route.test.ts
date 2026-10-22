import { NextRequest, NextResponse } from 'next/server'

import { MockLanguageModelV3 } from 'ai/test'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { POST } from '@/app/api/v1/ai/copilot/route'
import config from '~/config/app.json'

const state = vi.hoisted(() => ({ denied: null as NextResponse | null, models: new Map<string, unknown>() }))

vi.mock('@/lib/api', () => ({
  authorizeEditorRequest: vi.fn(() => Promise.resolve({ response: state.denied, user: { id: 'u1' } })),
  readJsonBody: async (request: NextRequest) => {
    try {
      return await request.json()
    } catch {
      return null
    }
  },
}))
vi.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: () => (id: string) => state.models.get(id),
}))

const usage = {
  inputTokens: { cacheRead: 0, cacheWrite: 0, noCache: 1, total: 1 },
  outputTokens: { reasoning: 0, text: 1, total: 1 },
}

const generating = (text: string) =>
  new MockLanguageModelV3({
    doGenerate: {
      content: [{ text, type: 'text' as const }],
      finishReason: { raw: 'stop', unified: 'stop' as const },
      usage,
      warnings: [],
    },
  })

const failing = (statusCode: number) =>
  new MockLanguageModelV3({
    doGenerate: () => Promise.reject(Object.assign(new Error('failed'), { statusCode })),
  })

const call = (body: unknown) =>
  POST(
    new NextRequest('http://localhost/api/v1/ai/copilot', {
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    })
  )

describe('POST /api/v1/ai/copilot', () => {
  const [first, second] = config.aiModels

  beforeEach(() => {
    state.denied = null
    state.models.clear()
    vi.stubEnv('GEMINI_API_KEY', 'test-key')
    vi.stubEnv('GEMINI_MODEL', '')
  })

  it('returns the authorization response for non-editors', async () => {
    state.denied = NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    expect((await call({ prompt: 'Hello' })).status).toBe(403)
  })

  it('rejects an empty prompt', async () => {
    expect((await call({ prompt: '' })).status).toBe(400)
  })

  it('answers 503 with a stable code when the key is missing', async () => {
    vi.stubEnv('GEMINI_API_KEY', '')
    const response = await call({ prompt: 'Hello' })
    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ error: 'ai_not_configured' })
  })

  it('returns only the completion text and falls back when the first model fails', async () => {
    state.models.set(first, failing(429))
    state.models.set(second, generating(' world'))
    const response = await call({ prompt: 'Hello' })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ text: ' world' })
  })

  it('answers 503 when every model fails', async () => {
    state.models.set(first, failing(404))
    state.models.set(second, failing(429))
    const response = await call({ prompt: 'Hello' })
    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ error: 'ai_unavailable' })
  })
})
