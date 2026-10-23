import { MockLanguageModelV3 } from 'ai/test'
import { describe, expect, it, vi } from 'vitest'

import { generateTextWithFallback } from '@/lib/ai'
import {
  type Segment,
  applySegments,
  buildInstructions,
  chunkSegments,
  collectSegments,
  translateSegments,
  validateOutput,
} from '@/lib/translate'

const usage = {
  inputTokens: { cacheRead: 0, cacheWrite: 0, noCache: 1, total: 1 },
  outputTokens: { reasoning: 0, text: 1, total: 1 },
}

const plate = [
  { children: [{ text: 'Team work' }], type: 'h1' },
  {
    children: [
      { text: 'Listen ' },
      { bold: true, text: 'actively' },
      { text: ' and ' },
      { children: [{ text: 'read the guide' }], type: 'a', url: 'https://glore.org/guide' },
      { code: true, text: 'npm run dev' },
    ],
    type: 'p',
  },
  { children: [{ children: [{ text: 'const hello = 1' }], type: 'code_line' }], type: 'code_block' },
  { children: [{ text: '' }], type: 'p' },
  { children: [{ text: '2026' }], type: 'p' },
]

const modelAnswering = (answer: (prompt: string) => string) =>
  new MockLanguageModelV3({
    doGenerate: ({ prompt }) => {
      const user = prompt.find(message => message.role === 'user')
      const text =
        user && Array.isArray(user.content) ? user.content.map(part => ('text' in part ? part.text : '')).join('') : ''
      return Promise.resolve({
        content: [{ text: answer(text), type: 'text' as const }],
        finishReason: { raw: 'stop', unified: 'stop' as const },
        usage,
        warnings: [],
      })
    },
  })

const generateWith = (model: MockLanguageModelV3) => async (request: { instructions: string; prompt: string }) =>
  (await generateTextWithFallback({ instructions: request.instructions, models: [model], prompt: request.prompt })).text

const prefix = (prompt: string) =>
  JSON.stringify(
    Object.fromEntries(
      Object.entries(JSON.parse(prompt) as Record<string, string>).map(([key, value]) => [key, `ES ${value}`])
    )
  )

describe('collectSegments', () => {
  it('walks text leaves in document order and skips code, empty text, and numbers', () => {
    const segments = collectSegments(plate, 'doc')
    expect(segments.map(({ text }) => text)).toEqual(['Team work', 'Listen ', 'actively', ' and ', 'read the guide'])
    expect(segments.map(({ path }) => path)).toEqual([
      'doc.0.children.0.text',
      'doc.1.children.0.text',
      'doc.1.children.1.text',
      'doc.1.children.2.text',
      'doc.1.children.3.children.0.text',
    ])
  })

  it('reads plain strings and string lists', () => {
    expect(collectSegments('Hello world', 'title')).toEqual([{ path: 'title', text: 'Hello world' }])
    expect(collectSegments(['First', '', 'Second'], 'outcomes').map(({ path }) => path)).toEqual([
      'outcomes.0',
      'outcomes.2',
    ])
    expect(collectSegments(null, 'empty')).toEqual([])
    expect(collectSegments('', 'empty')).toEqual([])
  })
})

describe('applySegments', () => {
  it('replaces only the translated leaves and keeps structure, marks, and links', () => {
    const translations = new Map(collectSegments(plate, 'doc').map(({ path, text }) => [path, text.toUpperCase()]))
    const result = applySegments(plate, 'doc', translations) as typeof plate
    expect(result[0]).toEqual({ children: [{ text: 'TEAM WORK' }], type: 'h1' })
    expect(result[1]?.children[1]).toEqual({ bold: true, text: 'ACTIVELY' })
    expect(result[1]?.children[3]).toEqual({
      children: [{ text: 'READ THE GUIDE' }],
      type: 'a',
      url: 'https://glore.org/guide',
    })
    expect(result[1]?.children[4]).toEqual({ code: true, text: 'npm run dev' })
    expect(result[2]).toEqual(plate[2])
    expect(result[4]).toEqual(plate[4])
  })

  it('does not mutate the source and keeps the edge spaces of a leaf', () => {
    const source = structuredClone(plate)
    const result = applySegments(source, 'doc', new Map([['doc.1.children.0.text', 'Escucha']])) as typeof plate
    expect(source).toEqual(plate)
    expect(result[1]?.children[0]).toEqual({ text: 'Escucha ' })
  })

  it('replaces strings and string lists', () => {
    expect(applySegments('Hello', 'title', new Map([['title', 'Hola']]))).toBe('Hola')
    expect(applySegments(['One', 'Two'], 'list', new Map([['list.1', 'Dos']]))).toEqual(['One', 'Dos'])
  })
})

describe('chunkSegments', () => {
  it('keeps order and starts a new chunk when the character budget is exceeded', () => {
    const segments: Segment[] = Array.from({ length: 4 }, (_, index) => ({ path: `p${index}`, text: 'x'.repeat(2500) }))
    const chunks = chunkSegments(segments)
    expect(chunks.map(chunk => chunk.length)).toEqual([2, 2])
    expect(chunks.flat()).toEqual(segments)
  })

  it('starts a new chunk after 60 segments', () => {
    const segments: Segment[] = Array.from({ length: 61 }, (_, index) => ({ path: `p${index}`, text: 'word' }))
    expect(chunkSegments(segments).map(chunk => chunk.length)).toEqual([60, 1])
    expect(chunkSegments([])).toEqual([])
  })
})

describe('validateOutput', () => {
  const chunk: Segment[] = [
    { path: 'a', text: 'Hello {name}, welcome to GloRe' },
    { path: 'b', text: 'Read [the guide](https://glore.org/guide) now' },
    { path: 'c', text: 'A plain sentence without extras' },
  ]
  const good = {
    0: 'Hola {name}, bienvenido a GloRe',
    1: 'Lee [la guía](https://glore.org/guide) ahora',
    2: 'Una frase simple sin extras',
  }

  it('maps accepted answers back to their paths, also inside a code fence', () => {
    const expected = { a: good[0], b: good[1], c: good[2] }
    expect(validateOutput(chunk, JSON.stringify(good))).toEqual({ ok: true, translations: expected })
    expect(validateOutput(chunk, `\`\`\`json\n${JSON.stringify(good)}\n\`\`\``)).toEqual({
      ok: true,
      translations: expected,
    })
  })

  it.each([
    ['not json', 'Sure! Here you go', 'format'],
    ['an array', '["a","b"]', 'format'],
    ['a missing key', JSON.stringify({ 0: good[0] }), 'keys'],
    ['an extra key', JSON.stringify({ ...good, 3: 'x' }), 'keys'],
    ['an empty value', JSON.stringify({ ...good, 1: '  ' }), 'empty'],
    ['a non-string value', JSON.stringify({ ...good, 1: 4 }), 'empty'],
    ['a lost placeholder', JSON.stringify({ ...good, 0: 'Hola, bienvenido a GloRe' }), 'placeholders'],
    ['a changed placeholder', JSON.stringify({ ...good, 0: 'Hola {nombre}, bienvenido a GloRe' }), 'placeholders'],
    ['a changed link', JSON.stringify({ ...good, 1: 'Lee [la guía](https://evil.example) ahora' }), 'links'],
    ['a runaway answer', JSON.stringify({ ...good, 2: 'x'.repeat(900) }), 'length'],
    ['a collapsed answer', JSON.stringify({ ...good, 2: 'Hi' }), 'length'],
  ])('rejects %s', (_label, output, reason) => {
    expect(validateOutput(chunk, output)).toEqual({ ok: false, reason })
  })
})

describe('translateSegments with a mocked model', () => {
  const segments: Segment[] = collectSegments(plate, 'doc')

  it('translates every chunk through generateTextWithFallback and returns one map', async () => {
    const model = modelAnswering(prefix)
    const result = await translateSegments(segments, 'English', { generate: generateWith(model), language: 'Spanish' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.translations['doc.0.children.0.text']).toBe('ES Team work')
    expect(Object.keys(result.translations)).toHaveLength(segments.length)
    expect(model.doGenerateCalls).toHaveLength(1)
  })

  it('sends the style rules and the target language in the instructions', async () => {
    const model = modelAnswering(prefix)
    await translateSegments(segments, 'English', { generate: generateWith(model), language: 'Italian' })
    const call = model.doGenerateCalls[0]
    const system = call?.prompt.find(message => message.role === 'system')
    const text = typeof system?.content === 'string' ? system.content : ''
    expect(text).toContain('to Italian')
    expect(text).toContain('informally with "tu"')
    expect(text).toContain('Peninsular Spanish')
    expect(text).toContain('sentence case')
    expect(text).toBe(buildInstructions('Italian', 'English'))
  })

  it('retries once on an unusable answer and then succeeds', async () => {
    let calls = 0
    const model = modelAnswering(prompt => {
      calls += 1
      return calls === 1 ? 'Sorry, I cannot do that' : prefix(prompt)
    })
    const result = await translateSegments(segments, 'English', { generate: generateWith(model), language: 'Spanish' })
    expect(result.ok).toBe(true)
    expect(calls).toBe(2)
  })

  it('fails with the last reason after the attempts run out', async () => {
    const model = modelAnswering(() => '{}')
    const result = await translateSegments(segments, 'English', {
      generate: generateWith(model),
      language: 'Spanish',
      maxAttempts: 3,
    })
    expect(result).toEqual({ ok: false, reason: 'keys' })
    expect(model.doGenerateCalls).toHaveLength(3)
  })

  it('stops at the first chunk that fails', async () => {
    const many: Segment[] = Array.from({ length: 70 }, (_, index) => ({ path: `p${index}`, text: `Word ${index}` }))
    const generate = vi.fn(() => Promise.resolve('nope'))
    const result = await translateSegments(many, 'English', { generate, language: 'Spanish', maxAttempts: 1 })
    expect(result.ok).toBe(false)
    expect(generate).toHaveBeenCalledTimes(1)
  })
})
