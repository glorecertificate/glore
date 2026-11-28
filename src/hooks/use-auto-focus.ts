import { useEffect } from 'react'

import { finePointer } from '@/lib/pointer'

export const useAutoFocus = (selector: string, enabled = true) => {
  useEffect(() => {
    if (!enabled || !finePointer()) return
    document.querySelector<HTMLElement>(selector)?.focus({ preventScroll: true })
  }, [enabled, selector])
}
