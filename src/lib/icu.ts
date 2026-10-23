export interface MessageSignature {
  errors: string[]
  tokens: string[]
}

const QUOTABLE = new Set(['{', '}', '<', '>'])

const BRANCH_TYPES = new Set(['plural', 'select', 'selectordinal'])

const TAG_REGEX = /^<\/?([A-Za-z][\w-]*)\s*\/?>/u

const ARGUMENT_STOPS = new Set([',', '}'])

const STYLE_STOPS = new Set(['}'])

const KEYWORD_STOPS = new Set(['{', '}', ' ', '\t', '\n'])

const readUntil = (text: string, start: number, stops: Set<string>) => {
  let index = start
  while (index < text.length && !stops.has(text[index] as string)) index++
  return index
}

interface Scanner {
  signature: MessageSignature
  text: string
}

const scanText = ({ signature, text }: Scanner, start: number, nested: boolean): number => {
  let index = start
  while (index < text.length) {
    const char = text[index]
    if (char === "'") {
      if (text[index + 1] === "'") {
        index += 2
        continue
      }
      if (QUOTABLE.has(text[index + 1] as string)) {
        const end = text.indexOf("'", index + 2)
        index = end === -1 ? text.length : end + 1
        continue
      }
      index++
      continue
    }
    if (char === '}') {
      if (nested) return index
      signature.errors.push('unmatched closing brace')
      index++
      continue
    }
    if (char === '<') {
      const match = TAG_REGEX.exec(text.slice(index))
      if (match) {
        if (!match[0].startsWith('</')) signature.tokens.push(`tag:${match[1]}`)
        index += match[0].length
        continue
      }
    }
    if (char === '{') {
      index = scanArgument({ signature, text }, index + 1)
      continue
    }
    index++
  }
  if (nested) signature.errors.push('unclosed branch')
  return index
}

interface Argument {
  name: string
  type: string
}

const scanBranches = ({ signature, text }: Scanner, start: number, { name, type }: Argument) => {
  let index = start
  let hasOther = false
  while (index < text.length) {
    while (/\s/u.test(text[index] ?? '')) index++
    if (text[index] === '}') {
      if (!hasOther) signature.errors.push(`${type} "${name}" has no "other" branch`)
      return index + 1
    }
    const keywordEnd = readUntil(text, index, KEYWORD_STOPS)
    const keyword = text.slice(index, keywordEnd)
    index = keywordEnd
    if (keyword.startsWith('offset:')) continue
    while (/\s/u.test(text[index] ?? '')) index++
    if (text[index] !== '{') {
      signature.errors.push(`${type} "${name}" has a malformed branch`)
      return text.length
    }
    if (keyword === 'other') hasOther = true
    if (type === 'select') signature.tokens.push(`case:${name}:${keyword}`)
    index = scanText({ signature, text }, index + 1, true) + 1
  }
  signature.errors.push(`${type} "${name}" is not closed`)
  return index
}

const scanArgument = ({ signature, text }: Scanner, start: number) => {
  const nameEnd = readUntil(text, start, ARGUMENT_STOPS)
  const name = text.slice(start, nameEnd).trim()
  if (nameEnd >= text.length) {
    signature.errors.push('unclosed argument')
    return text.length
  }
  if (text[nameEnd] === '}') {
    signature.tokens.push(`arg:${name}`)
    return nameEnd + 1
  }
  const typeEnd = readUntil(text, nameEnd + 1, ARGUMENT_STOPS)
  const type = text.slice(nameEnd + 1, typeEnd).trim()
  signature.tokens.push(`arg:${name}:${type === 'selectordinal' ? 'plural' : type}`)
  if (typeEnd >= text.length) {
    signature.errors.push('unclosed argument')
    return text.length
  }
  if (text[typeEnd] === '}') return typeEnd + 1
  if (BRANCH_TYPES.has(type)) return scanBranches({ signature, text }, typeEnd + 1, { name, type })
  const styleEnd = readUntil(text, typeEnd + 1, STYLE_STOPS)
  return styleEnd + 1
}

export const messageSignature = (message: string): MessageSignature => {
  const signature: MessageSignature = { errors: [], tokens: [] }
  scanText({ signature, text: message }, 0, false)
  signature.tokens.sort()
  return signature
}
