import 'server-only'

interface RateLimitEntry {
  count: number
  resetAt: number
}

const windows = new Map<string, RateLimitEntry>()

export const checkRateLimit = (key: string, max: number, windowMs: number) => {
  const now = Date.now()
  const entry = windows.get(key)

  if (!entry || entry.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs })
    return { limited: false, remaining: max - 1 }
  }

  if (entry.count >= max) {
    return { limited: true, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { limited: false, remaining: max - entry.count }
}
