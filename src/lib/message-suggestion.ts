import 'server-only'

import { type LanguageModel } from 'ai'

import { generateTextWithFallback } from '@/lib/ai'
import { DEFAULT_LOCALE } from '@/lib/i18n'
import { type RawCatalog, validateOverride } from '@/lib/message-validation'

const LANGUAGES: Record<string, string> = {
  en: 'US English',
  es: 'Peninsular Spanish, informal "tú" (never "usted")',
  it: 'Italian, informal "tu" (never "Lei")',
}

const RULES = [
  'Write in sentence case, not title case.',
  'Use the single character … instead of three dots.',
  'Keep every ICU placeholder, plural or select branch keyword, and tag (such as {name}, {count, plural, one {…} other {…}}, <link>…</link>) exactly as in the English source: same names, same count, same branch keywords.',
  'Translate only the text around them. Never translate placeholder names or tag names.',
  'Keep the meaning, length, and tone of the English source. The text is interface copy for a volunteering and soft skills certification platform.',
  'Output only the final message. No quotes, no code fences, no explanation, no alternatives.',
]

const FENCE_REGEX = /^```[\w-]*\n?([\s\S]*?)\n?```$/u

const MAX_OUTPUT_TOKENS = 1000

const TEMPERATURE = 0.2

interface SuggestionOptions {
  current: string | null
  en: RawCatalog
  key: string
  locale: string
  models: LanguageModel[]
  precompiled: boolean
}

export const buildSuggestionInstructions = (locale: string) =>
  [
    `You translate and polish interface messages into ${LANGUAGES[locale] ?? locale}.`,
    ...RULES.map(rule => `- ${rule}`),
  ].join('\n')

export const buildSuggestionPrompt = ({
  current,
  key,
  source,
}: {
  current: string | null
  key: string
  source: string
}) =>
  [
    `Message key: ${key}`,
    `English source:\n${source}`,
    current ? `Current text in the target language (reuse its terminology when it is good):\n${current}` : '',
  ]
    .filter(Boolean)
    .join('\n\n')

export const cleanSuggestion = (text: string) => {
  const trimmed = text.trim()
  const fenced = FENCE_REGEX.exec(trimmed)?.[1]?.trim() ?? trimmed
  const quoted = fenced.length > 1 && fenced.startsWith('"') && fenced.endsWith('"') ? fenced.slice(1, -1) : fenced
  return quoted.trim()
}

export const suggestMessageText = async ({ current, en, key, locale, models, precompiled }: SuggestionOptions) => {
  const source = en[key]
  if (source === undefined) return { ok: false, reason: 'ORPHANED' } as const

  let text: string
  try {
    const result = await generateTextWithFallback({
      instructions: buildSuggestionInstructions(locale),
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      models,
      prompt: buildSuggestionPrompt({ current: locale === DEFAULT_LOCALE ? null : current, key, source }),
      temperature: TEMPERATURE,
    })
    text = result.text
  } catch {
    return { ok: false, reason: 'UNAVAILABLE' } as const
  }

  const value = cleanSuggestion(text)
  if (!value) return { ok: false, reason: 'EMPTY' } as const
  const result = validateOverride({ en, key, precompiled, value })
  if (!result.ok) {
    return { ok: false, reason: result.reason.toUpperCase() as 'INCOMPATIBLE' | 'INVALID' | 'ORPHANED' } as const
  }
  return { ok: true, value } as const
}
