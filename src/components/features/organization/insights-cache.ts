export interface InsightsScope {
  organizationId: number
  userId: string
}

interface Entry<T> {
  at: number
  data: T | null
  organizationId: number
  pending: Promise<void>
  settled: boolean
  userId: string
}

export const INSIGHTS_FRESH_MS = 30_000

export const createInsightsCache = <T>(
  load: (organizationId: number) => Promise<T | null>,
  now: () => number = Date.now
) => {
  let entry: Entry<T> | null = null

  const matches = (scope: InsightsScope) =>
    entry !== null &&
    entry.organizationId === scope.organizationId &&
    entry.userId === scope.userId &&
    now() - entry.at <= INSIGHTS_FRESH_MS &&
    !(entry.settled && entry.data === null)

  const read = (scope: InsightsScope) => (entry && matches(scope) ? entry.data : null)

  const prefetch = (scope: InsightsScope) => {
    if (entry && matches(scope)) return entry.pending
    const next: Entry<T> = {
      at: now(),
      data: null,
      organizationId: scope.organizationId,
      pending: Promise.resolve(),
      settled: false,
      userId: scope.userId,
    }
    next.pending = (async () => {
      try {
        next.data = await load(scope.organizationId)
      } finally {
        next.settled = true
      }
    })()
    entry = next
    return next.pending
  }

  return { prefetch, read }
}
