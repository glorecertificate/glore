export interface Segment {
  path: string
  text: string
}

type TranslationFailure = 'format' | 'keys' | 'empty' | 'placeholders' | 'links' | 'length'

export type TranslationOutput =
  | { ok: true; translations: Record<string, string> }
  | { ok: false; reason: TranslationFailure }

type Generate = (request: { instructions: string; prompt: string }) => Promise<string>

interface TranslateOptions {
  generate: Generate
  language: string
  maxAttempts?: number
}

const SKIPPED_BLOCKS = new Set(['code_block', 'code_line'])
const MAX_CHUNK_CHARS = 5000
const MAX_CHUNK_SEGMENTS = 60
const MIN_LENGTH_RATIO = 0.2
const MAX_LENGTH_RATIO = 5
const LENGTH_CHECK_FROM = 24

const PLACEHOLDER_REGEX = /\{[^{}]+\}/gu
const LINK_REGEX = /\]\(([^)\s]+)[^)]*\)|https?:\/\/[^\s)]+/gu
const FENCE_REGEX = /^```(?:json)?\s*([\s\S]*?)\s*```$/u

const TRANSLATION_STYLE = [
  'Write sentence case, never title case, and use the single ellipsis character instead of three dots.',
  'English is US English. Spanish is Peninsular Spanish and addresses the reader informally with "tú". Italian addresses the reader informally with "tu".',
  'Use "Log in" and "Log out" in English, "Iniciar sesión" and "Cerrar sesión" in Spanish, and "Accedi" and "Esci" in Italian.',
  'Keep brand and organization names (GloRe, Associazione Joint) untranslated.',
]

export const hasText = (value: unknown): boolean => {
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.some(hasText)
  if (value && typeof value === 'object') {
    const node = value as { children?: unknown; text?: unknown }
    return hasText(node.text) || hasText(node.children)
  }
  return false
}

const isTranslatable = (text: string) => /\p{L}/u.test(text)

const walk = (value: unknown, path: string, segments: Segment[]) => {
  if (typeof value === 'string') {
    if (isTranslatable(value)) segments.push({ path, text: value })
    return
  }
  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) walk(item, `${path}.${index}`, segments)
    return
  }
  if (!value || typeof value !== 'object') return
  const node = value as { children?: unknown; code?: unknown; text?: unknown; type?: unknown }
  if (typeof node.type === 'string' && SKIPPED_BLOCKS.has(node.type)) return
  if (typeof node.text === 'string' && node.code !== true && isTranslatable(node.text)) {
    segments.push({ path: `${path}.text`, text: node.text })
  }
  if (Array.isArray(node.children)) walk(node.children, `${path}.children`, segments)
}

export const collectSegments = (value: unknown, path: string) => {
  const segments: Segment[] = []
  walk(value, path, segments)
  return segments
}

const keepEdges = (source: string, translated: string) => {
  const leading = /^\s*/u.exec(source)?.[0] ?? ''
  const trailing = /\s*$/u.exec(source)?.[0] ?? ''
  return `${leading}${translated.trim()}${trailing}`
}

const replace = (value: unknown, path: string, translations: ReadonlyMap<string, string>): unknown => {
  if (typeof value === 'string') {
    const translated = translations.get(path)
    return translated === undefined ? value : keepEdges(value, translated)
  }
  if (Array.isArray(value)) return value.map((item, index) => replace(item, `${path}.${index}`, translations))
  if (!value || typeof value !== 'object') return value
  const node = value as Record<string, unknown>
  const next: Record<string, unknown> = { ...node }
  const textPath = `${path}.text`
  if (typeof node.text === 'string' && translations.has(textPath)) {
    next.text = keepEdges(node.text, translations.get(textPath) as string)
  }
  if (Array.isArray(node.children)) next.children = replace(node.children, `${path}.children`, translations)
  return next
}

export const applySegments = (value: unknown, path: string, translations: ReadonlyMap<string, string>) =>
  replace(value, path, translations)

const chunkSegments = <T extends { text: string }>(segments: T[]) => {
  const chunks: T[][] = []
  let current: T[] = []
  let size = 0
  for (const segment of segments) {
    const overflow = current.length >= MAX_CHUNK_SEGMENTS || size + segment.text.length > MAX_CHUNK_CHARS
    if (overflow && current.length > 0) {
      chunks.push(current)
      current = []
      size = 0
    }
    current.push(segment)
    size += segment.text.length
  }
  if (current.length > 0) chunks.push(current)
  return chunks
}

const buildInstructions = (language: string, source: string) =>
  [
    `You are a professional translator for GloRe, an e-learning platform that certifies the soft skills people gain through volunteering. Translate from ${source} to ${language}.`,
    'The user message is a JSON object that maps numeric keys to text fragments. Fragments are consecutive pieces of one document: a fragment can start or end in the middle of a sentence, so use the neighbors for context but translate each fragment on its own.',
    'Reply with one JSON object only, with exactly the same keys and one translated string per key. No code fences, no comments, no extra keys.',
    'Keep every {placeholder}, URL, Markdown marker, emoji, and number as it is. Keep leading and trailing spaces out of the translation. Never merge, split, drop, or reorder fragments.',
    ...TRANSLATION_STYLE,
  ].join('\n')

const buildPrompt = (chunk: Segment[]) =>
  JSON.stringify(Object.fromEntries(chunk.map(({ text }, index) => [String(index), text])))

const occurrences = (text: string, pattern: RegExp) => [...text.matchAll(pattern)].map(match => match[1] ?? match[0])

const sameOccurrences = (a: string, b: string, pattern: RegExp) => {
  const left = occurrences(a, pattern).toSorted()
  const right = occurrences(b, pattern).toSorted()
  return left.length === right.length && left.every((item, index) => item === right[index])
}

const parseObject = (output: string) => {
  const trimmed = output.trim()
  const body = FENCE_REGEX.exec(trimmed)?.[1] ?? trimmed
  try {
    const parsed: unknown = JSON.parse(body)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null
  } catch {
    return null
  }
}

const validateOutput = (chunk: Segment[], output: string): TranslationOutput => {
  const parsed = parseObject(output)
  if (!parsed) return { ok: false, reason: 'format' }
  const expected = chunk.map((_, index) => String(index))
  const keys = Object.keys(parsed)
  if (keys.length !== expected.length || !expected.every(key => key in parsed)) return { ok: false, reason: 'keys' }
  const translations: Record<string, string> = {}
  for (const [index, segment] of chunk.entries()) {
    const value = parsed[String(index)]
    if (typeof value !== 'string' || !value.trim()) return { ok: false, reason: 'empty' }
    if (!sameOccurrences(segment.text, value, PLACEHOLDER_REGEX)) return { ok: false, reason: 'placeholders' }
    if (!sameOccurrences(segment.text, value, LINK_REGEX)) return { ok: false, reason: 'links' }
    const ratio = value.trim().length / segment.text.trim().length
    if (segment.text.trim().length >= LENGTH_CHECK_FROM && (ratio < MIN_LENGTH_RATIO || ratio > MAX_LENGTH_RATIO)) {
      return { ok: false, reason: 'length' }
    }
    translations[segment.path] = value
  }
  return { ok: true, translations }
}

const translateChunk = async (chunk: Segment[], source: string, options: TranslateOptions) => {
  const instructions = buildInstructions(options.language, source)
  const prompt = buildPrompt(chunk)
  const attempts = options.maxAttempts ?? 2
  let failure: TranslationFailure = 'format'
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const output = validateOutput(chunk, await options.generate({ instructions, prompt }))
    if (output.ok) return output
    failure = output.reason
  }
  return { ok: false, reason: failure } as const
}

export const translateSegments = async (
  segments: Segment[],
  source: string,
  options: TranslateOptions
): Promise<TranslationOutput> => {
  const translations: Record<string, string> = {}
  for (const chunk of chunkSegments(segments)) {
    const result = await translateChunk(chunk, source, options)
    if (!result.ok) return result
    Object.assign(translations, result.translations)
  }
  return { ok: true, translations }
}

export interface TranslateField {
  key: string
  text: unknown
}

type FieldFailure = TranslationFailure | 'aborted' | 'missing' | 'unavailable'

export type FieldOutcome = { key: string; ok: true; value: unknown } | { key: string; ok: false; reason: FieldFailure }

interface TranslatedElement {
  id: string
  text: string
}

interface GenerateElementsRequest {
  attempt: number
  instructions: string
  prompt: string
  signal?: AbortSignal
}

type GenerateElements = (request: GenerateElementsRequest) => AsyncIterable<TranslatedElement>

export type Limiter = <T>(task: () => Promise<T>) => Promise<T>

export interface TranslateFieldsOptions {
  generate: GenerateElements
  language: string
  limit?: Limiter
  maxAttempts?: number
  onField?: (outcome: FieldOutcome) => void
  signal?: AbortSignal
  sourceLanguage: string
}

interface FieldState {
  done: Map<string, string>
  field: TranslateField
  segments: Segment[]
  settled: boolean
}

interface Fragment {
  reason: FieldFailure
  segment: Segment
  state: FieldState
}

export const TRANSLATE_CONCURRENCY = 6

export const fieldCost = (text: unknown) => {
  const characters = collectSegments(text, 'cost').reduce((sum, segment) => sum + segment.text.length, 0)
  return Math.max(1, Math.ceil(characters / MAX_CHUNK_CHARS))
}

export const createLimiter = (max: number): Limiter => {
  let active = 0
  const queue: (() => void)[] = []
  const release = () => {
    const next = queue.shift()
    if (!next) {
      active -= 1
      return
    }
    return next()
  }
  return async task => {
    if (active >= max) await new Promise<void>(resolve => queue.push(resolve))
    if (active < max) active += 1
    try {
      return await task()
    } finally {
      release()
    }
  }
}

const buildFieldInstructions = (language: string, source: string) =>
  [
    `You are a professional translator for GloRe, an e-learning platform that certifies the soft skills people gain through volunteering. Translate from ${source} to ${language}.`,
    'The user message is a JSON array of fragments, each with an "id" and a "text". Fragments are consecutive pieces of one document: a fragment can start or end in the middle of a sentence, so use the neighbors for context but translate each fragment on its own.',
    'Reply with one object per fragment, with the same "id" and the translated "text". Never add, merge, split, drop, or reorder fragments.',
    'Keep every {placeholder}, URL, Markdown marker, emoji, and number as it is. Keep leading and trailing spaces out of the translation.',
    ...TRANSLATION_STYLE,
  ].join('\n')

const validateFragment = (source: string, value: string): TranslationFailure | null => {
  if (!value.trim()) return 'empty'
  if (!sameOccurrences(source, value, PLACEHOLDER_REGEX)) return 'placeholders'
  if (!sameOccurrences(source, value, LINK_REGEX)) return 'links'
  const length = source.trim().length
  const ratio = value.trim().length / length
  if (length >= LENGTH_CHECK_FROM && (ratio < MIN_LENGTH_RATIO || ratio > MAX_LENGTH_RATIO)) return 'length'
  return null
}

export const translateFields = async (
  fields: TranslateField[],
  { generate, language, limit, maxAttempts = 2, onField, signal, sourceLanguage }: TranslateFieldsOptions
): Promise<FieldOutcome[]> => {
  const run = limit ?? createLimiter(TRANSLATE_CONCURRENCY)
  const instructions = buildFieldInstructions(language, sourceLanguage)
  const outcomes = new Map<string, FieldOutcome>()

  const settle = (state: FieldState, outcome: FieldOutcome) => {
    if (state.settled) return
    state.settled = true
    outcomes.set(state.field.key, outcome)
    onField?.(outcome)
  }

  const states: FieldState[] = fields.map(field => ({
    done: new Map(),
    field,
    segments: collectSegments(field.text, field.key),
    settled: false,
  }))

  for (const state of states) {
    if (state.segments.length === 0) settle(state, { key: state.field.key, ok: true, value: state.field.text })
  }

  const accept = (fragment: Fragment, text: string) => {
    const { segment, state } = fragment
    state.done.set(segment.path, text)
    if (state.done.size < state.segments.length) return
    settle(state, {
      key: state.field.key,
      ok: true,
      value: applySegments(state.field.text, state.field.key, state.done),
    })
  }

  const processChunk = async (chunk: Fragment[]) => {
    let pending = chunk
    for (let attempt = 0; attempt < maxAttempts && pending.length > 0; attempt += 1) {
      pending = pending.filter(fragment => !fragment.state.settled)
      if (pending.length === 0 || signal?.aborted) break
      const batch = pending
      const accepted = new Set<number>()
      const prompt = JSON.stringify(batch.map(({ segment }, index) => ({ id: String(index), text: segment.text })))
      try {
        for await (const element of generate({ attempt, instructions, prompt, signal })) {
          const index = Number(element.id)
          const fragment = batch[index]
          if (!fragment || accepted.has(index) || typeof element.text !== 'string') continue
          const reason = validateFragment(fragment.segment.text, element.text)
          if (reason) {
            fragment.reason = reason
            continue
          }
          accepted.add(index)
          accept(fragment, element.text)
        }
      } catch {
        if (signal?.aborted) return
        for (const [index, fragment] of batch.entries()) {
          if (!accepted.has(index)) fragment.reason = 'unavailable'
        }
      }
      pending = batch.filter((_, index) => !accepted.has(index))
    }
    if (signal?.aborted) return
    for (const fragment of pending) {
      settle(fragment.state, { key: fragment.state.field.key, ok: false, reason: fragment.reason })
    }
  }

  const fragments = states.flatMap(state =>
    state.segments.map((segment): Fragment => ({ reason: 'missing', segment, state }))
  )
  await Promise.all(
    chunkSegments(fragments.map(fragment => ({ fragment, text: fragment.segment.text }))).map(chunk =>
      run(() => processChunk(chunk.map(item => item.fragment)))
    )
  )

  return states.map(
    state =>
      outcomes.get(state.field.key) ?? {
        key: state.field.key,
        ok: false,
        reason: signal?.aborted ? 'aborted' : 'missing',
      }
  )
}

type TranslateSkipReason = 'empty_source' | 'exists' | 'same_locale'

export type TranslateEvent =
  | { targets: string[]; total: number; type: 'start' }
  | { code: string; type: 'error' }
  | { failed: number; ok: number; skipped: number; type: 'done' }
  | { key: string; locale: string; reason: FieldFailure; status: 'failed'; type: 'field' }
  | { key: string; locale: string; reason: TranslateSkipReason; status: 'skipped'; type: 'field' }
  | {
      key: string
      locale: string
      status: 'ok'
      type: 'field'
      value: unknown
    }
