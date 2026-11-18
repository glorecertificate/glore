'use client'

import { useRef } from 'react'

export const useReturnFocus = () => {
  const target = useRef<HTMLElement | null>(null)

  const remember = () => {
    target.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
  }

  const restore = () => {
    const element = target.current
    target.current = null
    if (!element) return
    requestAnimationFrame(() => {
      if (element.isConnected) element.focus()
    })
  }

  return { remember, restore }
}
