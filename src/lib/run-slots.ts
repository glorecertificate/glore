const active = new Map<string, number>()

export const acquireRunSlot = (owner: string, max: number) => {
  const count = active.get(owner) ?? 0
  if (count >= max) return null
  active.set(owner, count + 1)
  let released = false
  return () => {
    if (released) return
    released = true
    const next = (active.get(owner) ?? 1) - 1
    if (next <= 0) {
      active.delete(owner)
      return
    }
    active.set(owner, next)
  }
}
