const seen = new Set<string>()

export const timed = async <T>(label: string, run: () => Promise<T>) => {
  const start = performance.now()
  const first = !seen.has(label)
  seen.add(label)
  const result = await run()
  const end = performance.now()
  if (process.env.VERCEL_ENV) {
    console.info(`[timing] ${label} ${Math.round(end - start)}ms first=${first} age=${Math.round(end / 1000)}s`)
  }
  return result
}
