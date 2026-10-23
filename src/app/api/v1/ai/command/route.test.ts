import { NextRequest, NextResponse } from 'next/server'

import { MockLanguageModelV3, simulateReadableStream } from 'ai/test'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { POST } from '@/app/api/v1/ai/command/route'
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
  createGoogle: () => (id: string) => state.models.get(id),
}))

const usage = {
  inputTokens: { cacheRead: 0, cacheWrite: 0, noCache: 1, total: 1 },
  outputTokens: { reasoning: 0, text: 1, total: 1 },
}

const streaming = (text: string) =>
  new MockLanguageModelV3({
    doStream: {
      stream: simulateReadableStream({
        chunks: [
          { type: 'stream-start' as const, warnings: [] },
          { id: 't', type: 'text-start' as const },
          { delta: text, id: 't', type: 'text-delta' as const },
          { id: 't', type: 'text-end' as const },
          { finishReason: { raw: 'stop', unified: 'stop' as const }, type: 'finish' as const, usage },
        ],
      }),
    },
  })

const valid = {
  ctx: {
    children: [{ children: [{ text: 'Hello world' }], id: 'a', type: 'p' }],
    selection: { anchor: { offset: 0, path: [0, 0] }, focus: { offset: 5, path: [0, 0] } },
  },
  messages: [{ id: 'm', parts: [{ text: 'Improve the writing', type: 'text' }], role: 'user' }],
}

const call = (body: unknown) =>
  POST(
    new NextRequest('http://localhost/api/v1/ai/command', {
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    })
  )

describe('POST /api/v1/ai/command', () => {
  beforeEach(() => {
    state.denied = null
    state.models.clear()
    vi.stubEnv('GEMINI_API_KEY', 'test-key')
    vi.stubEnv('GEMINI_MODEL', '')
  })

  it('returns the authorization response for non-editors', async () => {
    state.denied = NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    expect((await call(valid)).status).toBe(403)
  })

  it('rejects a body without the editor context', async () => {
    expect((await call({ messages: valid.messages })).status).toBe(400)
  })

  it('rejects a legacy body with a system prompt only', async () => {
    expect((await call({ messages: [], system: 'x' })).status).toBe(400)
  })

  it('answers 503 with a stable code when the key is missing', async () => {
    vi.stubEnv('GEMINI_API_KEY', '')
    const response = await call(valid)
    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ error: 'ai_not_configured' })
  })

  it('streams the first model and falls back to the second when the first is retired', async () => {
    const [first, second] = config.aiModels
    state.models.set(
      first,
      new MockLanguageModelV3({
        doStream: () =>
          Promise.reject(Object.assign(new Error('This model is no longer available'), { statusCode: 404 })),
      })
    )
    state.models.set(second, streaming('Better words for everyone'))
    const response = await call(valid)
    expect(response.status).toBe(200)
    const body = await response.text()
    const deltas = body
      .split('\n')
      .filter(line => line.startsWith('data: {'))
      .map(line => JSON.parse(line.slice(6)) as { delta?: string; type: string })
    expect(deltas.map(part => part.delta ?? '').join('')).toBe('Better words for everyone')
    expect(deltas.some(part => part.type === 'error')).toBe(false)
  })
})
