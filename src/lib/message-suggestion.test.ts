import { APICallError } from '@ai-sdk/provider'
import { MockLanguageModelV3 } from 'ai/test'
import { describe, expect, it } from 'vitest'

import {
  buildSuggestionInstructions,
  buildSuggestionPrompt,
  cleanSuggestion,
  suggestMessageText,
} from '@/lib/message-suggestion'

const usage = {
  inputTokens: { cacheRead: 0, cacheWrite: 0, noCache: 1, total: 1 },
  outputTokens: { reasoning: 0, text: 1, total: 1 },
}

const answering = (text: string) =>
  new MockLanguageModelV3({
    doGenerate: {
      content: [{ text, type: 'text' }],
      finishReason: { raw: 'stop', unified: 'stop' },
      usage,
      warnings: [],
    },
  })

const failing = () =>
  new MockLanguageModelV3({
    doGenerate: () =>
      Promise.reject(
        new APICallError({ message: 'down', requestBodyValues: {}, statusCode: 503, url: 'https://example.test' })
      ),
  })

const en = {
  'Common.greeting': 'Hello {name}',
  'Common.rich': 'Read <link>more</link>',
  'Common.days': '{count, plural, one {# day} other {# days}} left',
}

const suggest = (model: MockLanguageModelV3, key = 'Common.greeting', locale = 'es') =>
  suggestMessageText({ current: null, en, key, locale, models: [model], precompiled: true })

describe('cleanSuggestion', () => {
  it('trims the answer and removes code fences and wrapping quotes', () => {
    expect(cleanSuggestion('  Hola {name}  ')).toBe('Hola {name}')
    expect(cleanSuggestion('```\nHola {name}\n```')).toBe('Hola {name}')
    expect(cleanSuggestion('```text\nHola {name}\n```')).toBe('Hola {name}')
    expect(cleanSuggestion('"Hola {name}"')).toBe('Hola {name}')
  })
})

describe('prompt', () => {
  it('names the language register and the formatting rules', () => {
    expect(buildSuggestionInstructions('es')).toContain('informal "tú"')
    expect(buildSuggestionInstructions('it')).toContain('informal "tu"')
    expect(buildSuggestionInstructions('en')).toContain('US English')
    expect(buildSuggestionInstructions('es')).toContain('sentence case')
    expect(buildSuggestionInstructions('es')).toContain('…')
  })

  it('carries the key, the English source, and the current text', () => {
    const prompt = buildSuggestionPrompt({ current: 'Hola', key: 'Common.greeting', source: 'Hello {name}' })
    expect(prompt).toContain('Common.greeting')
    expect(prompt).toContain('Hello {name}')
    expect(prompt).toContain('Hola')
    expect(buildSuggestionPrompt({ current: null, key: 'k', source: 's' })).not.toContain('Current text')
  })
})

describe('suggestMessageText', () => {
  it('returns a suggestion that keeps the placeholders', async () => {
    const model = answering('Hola {name}')
    expect(await suggest(model)).toEqual({ ok: true, value: 'Hola {name}' })
    expect(model.doGenerateCalls).toHaveLength(1)
    const call = model.doGenerateCalls[0]
    expect(JSON.stringify(call?.prompt)).toContain('Hello {name}')
    expect(JSON.stringify(call?.prompt)).toContain('informal')
  })

  it('cleans a fenced answer before validating it', async () => {
    expect(await suggest(answering('```\nHola {name}\n```'))).toEqual({ ok: true, value: 'Hola {name}' })
  })

  it('accepts plural and tagged suggestions that keep the structure', async () => {
    expect(
      await suggest(answering('{count, plural, one {# día} other {# días}} restantes'), 'Common.days')
    ).toMatchObject({
      ok: true,
    })
    expect(await suggest(answering('Lee <link>más</link>'), 'Common.rich')).toMatchObject({ ok: true })
  })

  it('rejects a suggestion that drops or renames a placeholder', async () => {
    expect(await suggest(answering('Hola'))).toEqual({ ok: false, reason: 'INCOMPATIBLE' })
    expect(await suggest(answering('Hola {nombre}'))).toEqual({ ok: false, reason: 'INCOMPATIBLE' })
    expect(await suggest(answering('Lee más'), 'Common.rich')).toEqual({ ok: false, reason: 'INCOMPATIBLE' })
  })

  it('rejects a suggestion with broken ICU syntax', async () => {
    expect(await suggest(answering('Hola {name'))).toEqual({ ok: false, reason: 'INVALID' })
    expect(await suggest(answering('{count, plural, one {# día}}'), 'Common.days')).toEqual({
      ok: false,
      reason: 'INVALID',
    })
  })

  it('rejects an empty answer', async () => {
    expect(await suggest(answering('   '))).toEqual({ ok: false, reason: 'EMPTY' })
  })

  it('reports an unavailable model without throwing', async () => {
    expect(await suggest(failing())).toEqual({ ok: false, reason: 'UNAVAILABLE' })
  })

  it('refuses a key that no longer exists in English without calling the model', async () => {
    const model = answering('Hola')
    expect(await suggest(model, 'Common.removed')).toEqual({ ok: false, reason: 'ORPHANED' })
    expect(model.doGenerateCalls).toHaveLength(0)
  })

  it('falls back to the next model', async () => {
    const result = await suggestMessageText({
      current: null,
      en,
      key: 'Common.greeting',
      locale: 'it',
      models: [failing(), answering('Ciao {name}')],
      precompiled: false,
    })
    expect(result).toEqual({ ok: true, value: 'Ciao {name}' })
  })
})
