import { AUTH_ROOT, REGISTER_ROOT } from '@/lib/constants'

const ORIGIN = 'http://next-path.invalid'
const MAX_LENGTH = 2000
const BLOCKED_ROOTS = [AUTH_ROOT, REGISTER_ROOT, '/api']

const hasControlCharacter = (value: string) =>
  Array.from(value).some(character => {
    const code = character.charCodeAt(0)
    return code < 32 || code === 127
  })

const isBlocked = (pathname: string) => {
  const lowered = pathname.toLowerCase()
  return BLOCKED_ROOTS.some(root => lowered === root || lowered.startsWith(`${root}/`))
}

export const safeNextPath = (value: string | null | undefined) => {
  if (!value || value.length > MAX_LENGTH) return null
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return null
  if (hasControlCharacter(value)) return null

  try {
    const url = new URL(value, ORIGIN)
    const path = `${url.pathname}${url.search}`
    if (url.origin !== ORIGIN || path.startsWith('//') || path.includes('\\')) return null
    if (isBlocked(decodeURIComponent(url.pathname))) return null
    return path
  } catch {
    return null
  }
}
