import { unstable_rethrow } from 'next/navigation'

export const isNavigationError = (error: unknown) => {
  try {
    unstable_rethrow(error)
  } catch {
    return true
  }
  return false
}
