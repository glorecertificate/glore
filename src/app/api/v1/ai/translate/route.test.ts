import { NextRequest } from 'next/server'

import { simulateReadableStream } from 'ai'
import { MockLanguageModelV3 } from 'ai/test'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  authorize: vi.fn(),
  limited: vi.fn(),
  models: vi.fn(),
}))

vi.mock('@/lib/api', () => ({
  authorizeEditorRequest: mocks.authorize,
  readJsonBody: async (request: Request) => {
    try {
      return await request.json()
    } catch {
      return null
    }
  },
}))
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: mocks.limited }))
vi.mock('@/lib/ai', async importOriginal => ({
  ...(await importOriginal<typeof import('@/lib/ai')>()),
  resolveAiModels: mocks.models,
}))

const usage = {
  inputTokens: { cacheRead: 0, cacheWrite: 0, noCache: 1, total: 1 },
  outputTokens: { reasoning: 0, text: 1, total: 1 },
}

const promptItems = (prompt: unknown[]) => {
  const user = (prompt as { content: unknown; role: string }[]).find(message => message.role === 'user')
  const text = Array.isArray(user?.content)
    ? (user.content as { text?: string }[]).map(part => part.text ?? '').join('')
    : '[]'
  return JSON.parse(text) as { id: string; text: string }[]
}

const modelAnswering = (answer: (items: { id: string; text: string }[]) => { id: string; text: string }[]) =>
  new MockLanguageModelV3({
    doStream: ({ prompt }) => {
      const json = JSON.stringify({ elements: answer(promptItems(prompt)) })
      return Promise.resolve({
        stream: simulateReadableStream({
          chunks: [
            { type: 'stream-start' as const, warnings: [] },
            { id: '1', type: 'text-start' as const },
            { delta: json, id: '1', type: 'text-delta' as const },
            { id: '1', type: 'text-end' as const },
            { finishReason: { raw: 'stop', unified: 'stop' as const }, type: 'finish' as const, usage },
          ],
        }),
      })
    },
  })

const spanish = () => modelAnswering(items => items.map(item => ({ id: item.id, text: `ES ${item.text}` })))

const post = (body: unknown) =>
  new NextRequest('https://glore.test/api/v1/ai/translate', {
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  })

const readEvents = async (response: Response) => {
  const text = await response.text()
  return text
    .split('\n')
    .filter(Boolean)
    .map(line => JSON.parse(line) as Record<string, unknown>)
}

describe('POST /api/v1/ai/translate', () => {
  beforeEach(() => {
    mocks.authorize.mockResolvedValue({ response: null, user: { id: 'editor-1' } })
    mocks.limited.mockResolvedValue({ limited: false, remaining: 10 })
    mocks.models.mockReturnValue([spanish()])
  })

  it('streams one NDJSON event per field with the source hash and never needs the database', async () => {
    const { POST } = await import('./route')
    const response = await POST(
      post({
        fields: [
          { key: 'lessons:1:title', text: 'Hello' },
          { key: 'lessons:1:content', text: [{ children: [{ text: 'Body' }], type: 'p' }] },
        ],
        source: 'en',
        targets: ['es'],
      })
    )
    const events = await readEvents(response)

    expect(response.headers.get('content-type')).toContain('application/x-ndjson')
    expect(events[0]).toEqual({ targets: ['es'], total: 2, type: 'start' })
    const fields = events.filter(event => event.type === 'field')
    expect(fields).toHaveLength(2)
    expect(fields).toContainEqual({
      key: 'lessons:1:title',
      locale: 'es',
      status: 'ok',
      type: 'field',
      value: 'ES Hello',
    })
    expect(fields).toContainEqual(
      expect.objectContaining({
        key: 'lessons:1:content',
        value: [{ children: [{ text: 'ES Body' }], type: 'p' }],
      })
    )
    expect(events.at(-1)).toEqual({ failed: 0, ok: 2, skipped: 0, type: 'done' })
  })

  it('skips existing text, empty sources, and the source locale, and fills missing text', async () => {
    const { POST } = await import('./route')
    const events = await readEvents(
      await POST(
        post({
          fields: [
            { existing: { es: true }, key: 'filled', text: 'One' },
            { key: 'empty', text: '   ' },
            { key: 'missing', text: 'Four' },
          ],
          source: 'en',
          targets: ['es', 'en'],
        })
      )
    )
    const fields = events.filter(event => event.type === 'field')
    const by = (key: string, locale: string) => fields.find(event => event.key === key && event.locale === locale)

    expect(by('filled', 'es')).toMatchObject({ reason: 'exists', status: 'skipped' })
    expect(by('missing', 'es')).toMatchObject({ status: 'ok', value: 'ES Four' })
    expect(by('empty', 'es')).toMatchObject({ reason: 'empty_source', status: 'skipped' })
    expect(by('missing', 'en')).toMatchObject({ reason: 'same_locale', status: 'skipped' })
    expect(events.at(-1)).toMatchObject({ failed: 0, ok: 1, type: 'done' })
  })

  it('replaces existing text with replace', async () => {
    const { POST } = await import('./route')
    const events = await readEvents(
      await POST(
        post({
          fields: [{ existing: { es: true }, key: 'a', text: 'One' }],
          replace: true,
          source: 'en',
          targets: ['es'],
        })
      )
    )

    expect(events).toContainEqual(expect.objectContaining({ key: 'a', status: 'ok', value: 'ES One' }))
  })

  it('reports a failed field with the reason when the model keeps returning invalid text', async () => {
    mocks.models.mockReturnValue([modelAnswering(items => items.map(item => ({ id: item.id, text: ' ' })))])
    const { POST } = await import('./route')
    const events = await readEvents(
      await POST(post({ fields: [{ key: 'a', text: 'One' }], source: 'en', targets: ['es'] }))
    )

    expect(events).toContainEqual({ key: 'a', locale: 'es', reason: 'empty', status: 'failed', type: 'field' })
    expect(events.at(-1)).toEqual({ failed: 1, ok: 0, skipped: 0, type: 'done' })
  })

  it('falls back to the second model when the first one fails', async () => {
    const broken = new MockLanguageModelV3({ doStream: () => Promise.reject(new Error('down')) })
    mocks.models.mockReturnValue([broken, spanish()])
    const { POST } = await import('./route')
    const events = await readEvents(
      await POST(post({ fields: [{ key: 'a', text: 'One' }], source: 'en', targets: ['es'] }))
    )

    expect(events).toContainEqual(expect.objectContaining({ key: 'a', status: 'ok', value: 'ES One' }))
  })

  it('answers 429 before streaming when the field budget is spent, charging one unit per field and target', async () => {
    mocks.limited.mockResolvedValue({ limited: true, remaining: 0 })
    const { POST } = await import('./route')
    const response = await POST(
      post({
        fields: [
          { key: 'a', text: 'One' },
          { key: 'b', text: 'Two' },
        ],
        source: 'en',
        targets: ['es', 'it'],
      })
    )

    expect(response.status).toBe(429)
    expect(mocks.limited).toHaveBeenCalledWith(
      'ai-translate-fields:editor-1',
      expect.any(Number),
      expect.any(Number),
      4
    )
  })

  it('charges one unit per 5000 characters and rejects a third concurrent run', async () => {
    const { POST } = await import('./route')
    const long = 'x'.repeat(12_000)
    await POST(post({ fields: [{ key: 'a', text: long }], source: 'en', targets: ['es'] }))
    expect(mocks.limited).toHaveBeenCalledWith(
      'ai-translate-fields:editor-1',
      expect.any(Number),
      expect.any(Number),
      3
    )

    mocks.limited.mockResolvedValue({ limited: false, remaining: 10 })
    const never = new MockLanguageModelV3({ doStream: () => new Promise(() => undefined) })
    mocks.models.mockReturnValue([never])
    const body = { fields: [{ key: 'a', text: 'One' }], source: 'en', targets: ['es'] }
    const first = await POST(post(body))
    const second = await POST(post(body))
    const third = await POST(post(body))

    expect(third.status).toBe(429)
    await first.body?.cancel()
    await second.body?.cancel()
    const fourth = await POST(post(body))
    expect(fourth.status).toBe(200)
    await fourth.body?.cancel()
  })

  it('returns the guard response, 400 for a bad body, and 503 without a configured model', async () => {
    const { POST } = await import('./route')
    mocks.authorize.mockResolvedValueOnce({
      response: Response.json({ error: 'Forbidden' }, { status: 403 }),
      user: null,
    })
    expect((await POST(post({}))).status).toBe(403)
    expect((await POST(post({ fields: [], source: 'en', targets: ['es'] }))).status).toBe(400)
    mocks.models.mockReturnValue(null)
    expect((await POST(post({ fields: [{ key: 'a', text: 'One' }], source: 'en', targets: ['es'] }))).status).toBe(503)
  })

  it('stops generating when the client aborts', async () => {
    const { POST } = await import('./route')
    const controller = new AbortController()
    const request = new NextRequest('https://glore.test/api/v1/ai/translate', {
      body: JSON.stringify({ fields: [{ key: 'a', text: 'One' }], source: 'en', targets: ['es'] }),
      method: 'POST',
      signal: controller.signal,
    })
    const response = await POST(request)
    const reader = response.body?.getReader()
    await reader?.cancel()

    expect(response.status).toBe(200)
  })
})
