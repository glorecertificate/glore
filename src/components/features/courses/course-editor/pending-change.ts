export interface PendingChange<T> {
  commit: (value: T) => void
  value: T
}

interface Ref<T> {
  current: T
}

export const commitPending = <T>(
  pendingRef: Ref<PendingChange<T> | null>,
  timerRef: Ref<ReturnType<typeof setTimeout> | undefined>
) => {
  clearTimeout(timerRef.current)
  const pending = pendingRef.current
  pendingRef.current = null
  if (!pending) return null
  pending.commit(pending.value)
  return pending.value
}
