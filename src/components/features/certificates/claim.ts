interface ClaimResult {
  error?: unknown
}

export const failedClaims = async (ids: number[], assign: (id: number) => Promise<ClaimResult>) => {
  const results = await Promise.allSettled(ids.map(id => assign(id)))
  return ids.filter((_, index) => {
    const result = results[index]
    return result?.status === 'rejected' || Boolean(result?.value.error)
  })
}
