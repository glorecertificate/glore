export interface ReadingHeading {
  id: string
  level: 1 | 2 | 3
  line: number
  text: string
}

const HEADING = /^ {0,3}(#{1,3})[ \t]+(.+?)(?:[ \t]+#+)?[ \t]*$/u
const FENCE = /^ {0,3}(`{3,}|~{3,})([^\r\n]*)/u

const STAR = /(\*{1,3}|~~)(?=\S)([^*~]+?)(?<=\S)\1/gu
const UNDERSCORE = /(^|[\s\p{P}])(_{1,3})(?=\S)([^_]+?)(?<=\S)\2(?=[\s\p{P}]|$)/gu
const PLACEHOLDER = /\uE000(\d+)\uE001/gu

const stripEmphasis = (value: string) => {
  let current = value
  for (;;) {
    const next = current.replace(STAR, '$2').replace(UNDERSCORE, '$1$3')
    if (next === current) return next
    current = next
  }
}

const plain = (value: string) => {
  const kept: string[] = []
  const keep = (text: string) => `\uE000${kept.push(text) - 1}\uE001`
  const withoutLiterals = value
    .replace(/`+([^`]*?)`+/gu, (_match, code: string) => keep(code))
    .replace(/\\([!-/:-@[-`{-~])/gu, (_match, char: string) => keep(char))
  const text = stripEmphasis(withoutLiterals.replace(/!?\[([^\]]*)\]\([^)]*\)/gu, '$1'))
  return text.replace(PLACEHOLDER, (_match, index: string) => kept[Number(index)] ?? '').trim()
}

const slugifyHeading = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/gu, '')

export const extractHeadings = (markdown: string): ReadingHeading[] => {
  const used = new Map<string, number>()
  const headings: ReadingHeading[] = []
  let fence: string | null = null

  for (const [index, line] of markdown.split(/\r?\n/u).entries()) {
    const marker = FENCE.exec(line)
    if (fence) {
      const closes =
        marker && marker[1]?.[0] === fence[0] && (marker[1]?.length ?? 0) >= fence.length && !marker[2]?.trim()
      if (closes) fence = null
      continue
    }
    if (marker) {
      fence = marker[1] ?? null
      continue
    }
    const match = HEADING.exec(line)
    if (!match) continue
    const text = plain(match[2] ?? '')
    const base = slugifyHeading(text) || 'section'
    let count = used.get(base) ?? 0
    let id = count === 0 ? base : `${base}-${count}`
    while (used.has(id)) {
      count += 1
      id = `${base}-${count}`
    }
    used.set(base, count + 1)
    used.set(id, 1)
    const level = (match[1]?.length ?? 2) as 1 | 2 | 3
    headings.push({ id, level, line: index + 1, text })
  }

  return headings
}

export const headingIdsByLine = (headings: ReadingHeading[]) =>
  Object.fromEntries(headings.map(({ id, line }) => [line, id])) as Record<number, string>
