import compile from 'icu-minify/compile'
import format, { type FormatValues } from 'icu-minify/format'

import { messageSignature } from '@/lib/icu'

export interface ArgumentSpec {
  kind: 'date' | 'number' | 'select' | 'text'
  name: string
  options: string[]
}

export type SampleValues = Record<string, string>

const SAMPLE_NUMBER = '3'

const SAMPLE_DATE = '2026-01-15'

const TOKEN_SEPARATOR = ':'

const DATE_TYPES = new Set(['date', 'time'])

const NUMBER_TYPES = new Set(['number', 'plural'])

const formatters = {
  getDateTimeFormat: (...args: ConstructorParameters<typeof Intl.DateTimeFormat>) => new Intl.DateTimeFormat(...args),
  getNumberFormat: (...args: ConstructorParameters<typeof Intl.NumberFormat>) => new Intl.NumberFormat(...args),
  getPluralRules: (...args: ConstructorParameters<typeof Intl.PluralRules>) => new Intl.PluralRules(...args),
}

const kindOf = (type: string | undefined): ArgumentSpec['kind'] => {
  if (type === 'select') return 'select'
  if (type && DATE_TYPES.has(type)) return 'date'
  if (type && NUMBER_TYPES.has(type)) return 'number'
  return 'text'
}

export const argumentSpecs = (source: string): ArgumentSpec[] => {
  const { tokens } = messageSignature(source)
  const options = new Map<string, string[]>()
  for (const token of tokens) {
    const [prefix, name, keyword] = token.split(TOKEN_SEPARATOR)
    if (prefix !== 'case' || !name || !keyword) continue
    options.set(name, [...(options.get(name) ?? []), keyword])
  }
  const specs = new Map<string, ArgumentSpec>()
  for (const token of tokens) {
    const [prefix, name, type] = token.split(TOKEN_SEPARATOR)
    if (prefix !== 'arg' || !name) continue
    specs.set(name, { kind: kindOf(type), name, options: options.get(name) ?? [] })
  }
  return [...specs.values()]
}

export const tagNames = (source: string) =>
  messageSignature(source).tokens.flatMap(token => (token.startsWith('tag:') ? [token.slice('tag:'.length)] : []))

export const sampleValues = (source: string): SampleValues =>
  Object.fromEntries(
    argumentSpecs(source).map(({ kind, name, options }) => {
      if (kind === 'number') return [name, SAMPLE_NUMBER]
      if (kind === 'date') return [name, SAMPLE_DATE]
      if (kind === 'select') return [name, options.find(option => option !== 'other') ?? 'other']
      return [name, `«${name}»`]
    })
  )

const sampleValue = (kind: ArgumentSpec['kind'], sample: string) => {
  if (kind === 'number') return Number.isFinite(Number(sample)) && sample !== '' ? Number(sample) : 0
  if (kind === 'date') return Number.isNaN(Date.parse(sample)) ? new Date(0) : new Date(sample)
  return sample
}

const toFormatValues = (source: string, samples: SampleValues): FormatValues<string> => {
  const values: FormatValues<string> = {}
  for (const { kind, name } of argumentSpecs(source)) values[name] = sampleValue(kind, samples[name] ?? '')
  for (const tag of tagNames(source)) values[tag] = chunks => `‹${chunks.join('')}›`
  return values
}

export const renderPreview = ({
  locale,
  samples,
  source,
  value,
}: {
  locale: string
  samples: SampleValues
  source: string
  value: string
}) => {
  try {
    const result = format<string>(compile(value), locale, toFormatValues(source, samples), { formatters })
    return { ok: true, text: Array.isArray(result) ? result.join('') : String(result) } as const
  } catch {
    return { ok: false, text: '' } as const
  }
}

export const placeholdersOf = (source: string) => [
  ...argumentSpecs(source).map(({ name }) => `{${name}}`),
  ...tagNames(source).map(name => `<${name}>`),
]
