const MAX_DEPTH = 2

const strip = (message: string) => message.split(/\nparams:|params:/u)[0]?.trim() ?? ''

const describe = (error: unknown, isRoot: boolean) => {
  if (!(error instanceof Error)) return ''
  if (error.message.startsWith('Failed query')) return error.name
  const message = strip(error.message)
  if (isRoot) return message || error.name
  return message ? `${error.name}: ${message}` : error.name
}

export const describeAuthError = (error: unknown) => {
  const parts: string[] = []
  let current: unknown = error
  for (let depth = 0; depth <= MAX_DEPTH && current instanceof Error; depth++) {
    const part = describe(current, depth === 0)
    if (part) parts.push(part)
    current = current.cause
  }
  return parts.join(' | cause: ')
}
