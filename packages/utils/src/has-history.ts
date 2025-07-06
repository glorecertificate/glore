/**
 * Checks if the user has a history of visiting the current website.
 */
export const hasHistory = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false
  const { referrer } = document
  return !!referrer && referrer.startsWith(window.location.origin) && referrer !== window.location.href
}

export default hasHistory
