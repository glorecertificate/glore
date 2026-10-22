import { APICallError, type LanguageModelV3StreamPart } from '@ai-sdk/provider'
import { MockLanguageModelV3, simulateReadableStream } from 'ai/test'
import { describe, expect, it, vi } from 'vitest'

import { AI_ERROR, generateTextWithFallback, resolveAiModels, streamTextWithFallback } from '@/lib/ai'
import config from '~/config/app.json'

const usage = {
  inputTokens: { cacheRead: 0, cacheWrite: 0, noCache: 1, total: 1 },
  outputTokens: { reasoning: 0, text: 1, total: 1 },
}

const apiError = (statusCode: number) =>
  new APICallError({
    message: `status ${statusCode}`,
    requestBodyValues: {},
    statusCode,
    url: 'https://generativelanguage.googleapis.com',
  })

const streamOf = (chunks: object[]) => ({
  stream: simulateReadableStream({
    chunks: [{ type: 'stream-start' as const, warnings: [] }, ...chunks] as LanguageModelV3StreamPart[],
  }),
})

const finish = { finishReason: { raw: 'stop', unified: 'stop' as const }, type: 'finish' as const, usage }

const streaming = (...deltas: string[]) =>
  new MockLanguageModelV3({
    doStream: streamOf([
      { id: 't', type: 'text-start' },
      ...deltas.map(delta => ({ delta, id: 't', type: 'text-delta' })),
      { id: 't', type: 'text-end' },
      finish,
    ]),
  })

const streamingThenFailing = () =>
  new MockLanguageModelV3({
    doStream: streamOf([
      { id: 't', type: 'text-start' },
      { delta: 'Partial', id: 't', type: 'text-delta' },
      { error: apiError(503), type: 'error' },
    ]),
  })

const failing = (statusCode: number) =>
  new MockLanguageModelV3({
    doGenerate: () => Promise.reject(apiError(statusCode)),
    doStream: () => Promise.reject(apiError(statusCode)),
  })

const stalled = () =>
  new MockLanguageModelV3({
    doGenerate: ({ abortSignal }) =>
      new Promise((_resolve, reject) => {
        abortSignal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
      }),
    doStream: ({ abortSignal }) =>
      new Promise((_resolve, reject) => {
        abortSignal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
      }),
  })

const generating = (text: string) =>
  new MockLanguageModelV3({
    doGenerate: {
      content: [{ text, type: 'text' }],
      finishReason: { raw: 'stop', unified: 'stop' },
      usage,
      warnings: [],
    },
  })

const run = async (models: MockLanguageModelV3[], firstTokenTimeoutMs?: number) => {
  const response = streamTextWithFallback({ firstTokenTimeoutMs, models, prompt: 'Hello' })
  return await response.text()
}

describe('resolveAiModels', () => {
  it('returns null without an API key', () => {
    vi.stubEnv('GEMINI_API_KEY', '')
    expect(resolveAiModels()).toBeNull()
  })

  it('puts the GEMINI_MODEL override first and keeps the configured chain after it', () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-key')
    vi.stubEnv('GEMINI_MODEL', 'gemini-override')
    const ids = resolveAiModels()?.map(model => (typeof model === 'string' ? model : model.modelId))
    expect(ids).toEqual(['gemini-override', ...config.aiModels])
  })

  it('does not repeat a model already in the chain', () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-key')
    vi.stubEnv('GEMINI_MODEL', config.aiModels[0])
    expect(resolveAiModels()).toHaveLength(config.aiModels.length)
  })

  it('uses the configured chain without an override', () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-key')
    vi.stubEnv('GEMINI_MODEL', '')
    expect(resolveAiModels()).toHaveLength(config.aiModels.length)
  })
})

describe('streamTextWithFallback', () => {
  it('streams the first model and never calls the second', async () => {
    const first = streaming('Hello', ' world')
    const second = streaming('Unused')
    const body = await run([first, second])
    expect(body).toContain('Hello')
    expect(body).not.toContain('error')
    expect(second.doStreamCalls).toHaveLength(0)
    expect(first.doStreamCalls[0].providerOptions).toEqual({ google: { thinkingConfig: { thinkingLevel: 'low' } } })
  })

  it.each([404, 429, 503])('falls back to the second model after a %i before any text', async status => {
    const second = streaming('Recovered')
    const body = await run([failing(status), second])
    expect(body).toContain('Recovered')
    expect(body).not.toContain(AI_ERROR.unavailable)
    expect(second.doStreamCalls).toHaveLength(1)
  })

  it('reports an error when every model fails', async () => {
    const body = await run([failing(404), failing(429)])
    expect(body).toContain('"type":"error"')
    expect(body).toContain(AI_ERROR.unavailable)
  })

  it('surfaces an error part and skips the next model once text has streamed', async () => {
    const second = streaming('Unused')
    const body = await run([streamingThenFailing(), second])
    expect(body).toContain('Partial')
    expect(body).toContain(AI_ERROR.unavailable)
    expect(second.doStreamCalls).toHaveLength(0)
  })

  it('falls back when a model sends no text before the first token timeout', async () => {
    const second = streaming('Fast')
    const body = await run([stalled(), second], 50)
    expect(body).toContain('Fast')
    expect(body).not.toContain(AI_ERROR.unavailable)
    expect(second.doStreamCalls).toHaveLength(1)
  })

  it('gives the last model no first token timeout', async () => {
    const slow = new MockLanguageModelV3({
      doStream: {
        stream: simulateReadableStream({
          chunks: [
            { type: 'stream-start', warnings: [] },
            { id: 't', type: 'text-start' },
            { delta: 'Late', id: 't', type: 'text-delta' },
            { id: 't', type: 'text-end' },
            finish,
          ] as LanguageModelV3StreamPart[],
          initialDelayInMs: 120,
        }),
      },
    })
    const body = await run([failing(404), slow], 50)
    expect(body).toContain('Late')
  })

  it('falls back when a model finishes without any text', async () => {
    const empty = streaming()
    const second = streaming('Filled')
    const body = await run([empty, second])
    expect(body).toContain('Filled')
  })
})

describe('generateTextWithFallback', () => {
  it('returns the first model result without calling the second', async () => {
    const first = generating('First')
    const second = generating('Second')
    const result = await generateTextWithFallback({ models: [first, second], prompt: 'Hello' })
    expect(result.text).toBe('First')
    expect(second.doGenerateCalls).toHaveLength(0)
  })

  it.each([404, 429, 500])('falls back after a %i', async status => {
    const result = await generateTextWithFallback({
      models: [failing(status), generating('Second')],
      prompt: 'Hello',
    })
    expect(result.text).toBe('Second')
  })

  it('falls back when a model does not answer before the timeout', async () => {
    const result = await generateTextWithFallback({
      firstTokenTimeoutMs: 50,
      models: [stalled(), generating('Second')],
      prompt: 'Hello',
    })
    expect(result.text).toBe('Second')
  })

  it('throws when every model fails', async () => {
    await expect(
      generateTextWithFallback({ models: [failing(404), failing(429)], prompt: 'Hello' })
    ).rejects.toBeInstanceOf(APICallError)
  })

  it('does not fall back after an abort', async () => {
    const controller = new AbortController()
    controller.abort()
    const second = generating('Second')
    const aborting = new MockLanguageModelV3({
      doGenerate: () => Promise.reject(new DOMException('aborted', 'AbortError')),
    })
    await expect(
      generateTextWithFallback({ abortSignal: controller.signal, models: [aborting, second], prompt: 'Hello' })
    ).rejects.toThrow()
    expect(second.doGenerateCalls).toHaveLength(0)
  })
})
