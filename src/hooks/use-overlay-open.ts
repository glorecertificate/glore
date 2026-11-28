import { useState } from 'react'

import { useResetOnHide } from '@/hooks/use-reset-on-hide'

export interface OverlayOpenProps {
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  open?: boolean
}

export const useOverlayOpen = ({ defaultOpen = false, onOpenChange, open }: OverlayOpenProps) => {
  const [inner, setInner] = useState(defaultOpen)
  const value = open ?? inner

  const change = (next: boolean) => {
    setInner(next)
    onOpenChange?.(next)
  }

  useResetOnHide(() => {
    if (value) change(false)
  })

  return { onOpenChange: change, open: value }
}
