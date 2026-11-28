import { useEffect } from 'react'

import { START_SLOP, dragIntent, shouldDismiss } from '@/lib/drag-dismiss'

const PHONE_QUERY = '(max-width: 639px)'
const SKIP = 'input, textarea, select, [contenteditable=true], [role=slider], [data-drag-dismiss=off]'

const scrolledAbove = (target: HTMLElement, root: HTMLElement) => {
  for (let node: HTMLElement | null = target; node && node !== root.parentElement; node = node.parentElement) {
    if (node.scrollTop > 0) return true
  }
  return false
}

export const useDragDismiss = (
  node: HTMLElement | null,
  { enabled = true, query = PHONE_QUERY }: { enabled?: boolean; query?: string } = {}
) => {
  useEffect(() => {
    if (!node || !enabled) return
    const drag = { active: false, delta: 0, startTime: 0, startX: 0, startY: 0, tracking: false }

    const reset = () => {
      node.style.transition = 'translate 200ms cubic-bezier(0.22, 1, 0.36, 1)'
      node.style.translate = ''
    }

    const dismiss = () => {
      node.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Escape' }))
      requestAnimationFrame(() => {
        if (node.isConnected && node.dataset.state === 'open') reset()
      })
    }

    const start = (event: TouchEvent) => {
      const target = event.target as HTMLElement
      if (event.touches.length !== 1 || !window.matchMedia(query).matches) return
      if (target.closest(SKIP) || scrolledAbove(target, node)) return
      Object.assign(drag, {
        active: false,
        delta: 0,
        startTime: performance.now(),
        startX: event.touches[0].clientX,
        startY: event.touches[0].clientY,
        tracking: true,
      })
    }

    const move = (event: TouchEvent) => {
      if (!drag.tracking) return
      const delta = event.touches[0].clientY - drag.startY
      const intent = drag.active ? 'drag' : dragIntent(event.touches[0].clientX - drag.startX, delta)
      if (intent === 'pending') return
      if (intent === 'cancel') {
        drag.tracking = false
        return
      }
      drag.active = true
      event.preventDefault()
      drag.delta = Math.max(0, delta - START_SLOP)
      node.style.transition = 'none'
      node.style.translate = `0 ${drag.delta}px`
    }

    const end = () => {
      if (!drag.tracking) return
      drag.tracking = false
      if (!drag.active) return
      drag.active = false
      const elapsed = performance.now() - drag.startTime
      if (shouldDismiss({ delta: drag.delta, elapsed, height: node.offsetHeight })) return dismiss()
      reset()
    }

    node.addEventListener('touchstart', start, { passive: true })
    node.addEventListener('touchmove', move, { passive: false })
    node.addEventListener('touchend', end)
    node.addEventListener('touchcancel', end)
    return () => {
      node.removeEventListener('touchstart', start)
      node.removeEventListener('touchmove', move)
      node.removeEventListener('touchend', end)
      node.removeEventListener('touchcancel', end)
    }
  }, [enabled, node, query])
}
