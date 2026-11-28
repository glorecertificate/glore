export const finePointer = () => typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches

export const focusRootOnTouch = (event: Event) => {
  if (finePointer()) return false
  event.preventDefault()
  ;(event.currentTarget as HTMLElement | null)?.focus({ preventScroll: true })
  return true
}
