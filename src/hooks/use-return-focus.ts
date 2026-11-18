'use client'

import { useRef } from 'react'

type Fallback = HTMLElement | null | undefined | (() => HTMLElement | null | undefined)

const OPEN_MENU_TRIGGER = '[data-slot="dropdown-menu-trigger"][aria-expanded="true"]'

export const useReturnFocus = () => {
  const target = useRef<HTMLElement | null>(null)

  const remember = (element?: HTMLElement | null) => {
    const trigger = document.querySelector<HTMLElement>(OPEN_MENU_TRIGGER)
    const active = document.activeElement instanceof HTMLElement ? document.activeElement : null
    target.current = element ?? trigger ?? active
  }

  const restore = (event: Event, fallback?: Fallback) => {
    const element = target.current
    target.current = null
    const next = element?.isConnected ? element : typeof fallback === 'function' ? fallback() : fallback
    if (!next) return
    event.preventDefault()
    next.focus()
  }

  return { remember, restore }
}
