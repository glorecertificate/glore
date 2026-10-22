const CLOSED_AUTH_PREFIXES = ['/api/auth/admin', '/api/auth/impersonation']

export const readLimitedBody = async (body: ReadableStream<Uint8Array> | null, maxBytes: number) => {
  const chunks: Uint8Array[] = []
  let size = 0
  if (!body) return { bytes: new Uint8Array(), tooLarge: false }
  for await (const chunk of body) {
    size += chunk.byteLength
    if (size > maxBytes) return { bytes: null, tooLarge: true }
    chunks.push(chunk)
  }
  const bytes = new Uint8Array(size)
  chunks.reduce((offset, chunk) => {
    bytes.set(chunk, offset)
    return offset + chunk.byteLength
  }, 0)
  return { bytes, tooLarge: false }
}

export const isClosedAuthPath = (url: string) => {
  const { pathname } = new URL(url)
  const decoded = (() => {
    try {
      return decodeURIComponent(pathname)
    } catch {
      return pathname
    }
  })()
  const normalized = decoded.replaceAll(/\/{2,}/gu, '/').toLowerCase()
  return CLOSED_AUTH_PREFIXES.some(prefix => normalized === prefix || normalized.startsWith(`${prefix}/`))
}
