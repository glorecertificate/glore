const BROWSERS = [
  [/Edg(?:e|A|iOS)?\//u, 'Edge'],
  [/OPR\/|Opera/u, 'Opera'],
  [/Firefox\/|FxiOS\//u, 'Firefox'],
  [/Chrome\/|CriOS\//u, 'Chrome'],
  [/Safari\//u, 'Safari'],
] as const

const SYSTEMS = [
  [/iPhone|iPad|iPod/u, 'iOS'],
  [/Android/u, 'Android'],
  [/Windows/u, 'Windows'],
  [/Mac OS X|Macintosh/u, 'macOS'],
  [/CrOS/u, 'ChromeOS'],
  [/Linux/u, 'Linux'],
] as const

const match = (value: string, table: readonly (readonly [RegExp, string])[]) =>
  table.find(([pattern]) => pattern.test(value))?.[1] ?? null

export const describeUserAgent = (userAgent: string | null | undefined) => {
  if (!userAgent) return { browser: null, system: null }
  return { browser: match(userAgent, BROWSERS), system: match(userAgent, SYSTEMS) }
}
