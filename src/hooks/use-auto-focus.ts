import { useEffect } from 'react'

export const useAutoFocus = (selector: string, enabled = true) => {
  useEffect(() => {
    if (!enabled || !window.matchMedia('(pointer: fine)').matches) return
    document.querySelector<HTMLElement>(selector)?.focus()
  }, [enabled, selector])
}
