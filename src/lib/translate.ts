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

export const chunkSegments = (segments: Segment[]) => {
  const chunks: Segment[][] = []
  let current: Segment[] = []
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

export const buildInstructions = (language: string, source: string) =>
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

export const validateOutput = (chunk: Segment[], output: string): TranslationOutput => {
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
