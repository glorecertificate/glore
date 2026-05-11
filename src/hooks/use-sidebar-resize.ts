'use client'

import { useEffect, useRef } from 'react'

const parseWidth = (width: string) => {
  const unit = width.endsWith('rem') ? 'rem' : 'px'
  return { unit, value: Number.parseFloat(width) }
}

export const toPx = (width: string) => {
  const { value, unit } = parseWidth(width)
  return unit === 'rem' ? value * 16 : value
}

const toUnit = (px: number, unit: string) => `${Number.parseFloat((unit === 'rem' ? px / 16 : px).toFixed(3))}${unit}`

export const useSidebarResize = ({
  currentWidth,
  direction = 'right',
  enableDrag = true,
  enableToggle = true,
  isCollapsed = false,
  maxResizeWidth = '22rem',
  minResizeWidth = '14rem',
  onResize,
  onToggle,
  setIsDraggingRail = () => {},
}: {
  currentWidth: string
  direction?: 'left' | 'right'
  enableDrag?: boolean
  enableToggle?: boolean
  isCollapsed?: boolean
  maxResizeWidth?: string
  minResizeWidth?: string
  onResize: (width: string, options?: { syncState?: boolean }) => void
  onToggle?: () => void
  setIsDraggingRail?: (isDragging: boolean) => void
}) => {
  const dragRef = useRef<HTMLButtonElement>(null)

  const propsRef = useRef({ currentWidth, enableToggle, isCollapsed, onResize, onToggle, setIsDraggingRail })
  useEffect(() => {
    propsRef.current = { currentWidth, enableToggle, isCollapsed, onResize, onToggle, setIsDraggingRail }
  })

  const minPx = toPx(minResizeWidth)
  const maxPx = toPx(maxResizeWidth)

  const onMouseDown = (e: React.MouseEvent) => {
    if (!enableDrag) {
      return
    }
    e.preventDefault()

    const { currentWidth: refWidth, isCollapsed: refCollapsed } = propsRef.current
    const { unit } = parseWidth(refWidth)
    const startX = e.clientX
    let dragged = false
    let collapsed = refCollapsed
    let latestWidth = refWidth
    let referenceX = startX
    let lastToggleTime = 0

    const getSidebarEl = () => dragRef.current?.closest<HTMLElement>('[data-side]')

    const setDragging = (active: boolean) => {
      propsRef.current.setIsDraggingRail(active)
      const el = getSidebarEl()
      if (el) {
        el.dataset.dragging = String(active)
      }
    }

    const onMouseMove = (evt: MouseEvent) => {
      if (!dragged) {
        if (Math.abs(evt.clientX - startX) <= 5) {
          return
        }
        dragged = true
        Object.assign(document.body.style, { cursor: 'ew-resize', userSelect: 'none' })
        setDragging(true)
      }

      const rawPx = direction === 'left' ? window.innerWidth - evt.clientX : evt.clientX
      const now = Date.now()
      const canToggle = now - lastToggleTime > 200

      if (collapsed) {
        if (!canToggle) {
          return
        }
        const expandDist = direction === 'left' ? referenceX - evt.clientX : evt.clientX - referenceX
        if (expandDist > minPx * 0.2) {
          collapsed = false
          lastToggleTime = now
          referenceX = evt.clientX
          setDragging(true)
          propsRef.current.onToggle?.()
          const clamped = Math.max(minPx, Math.min(maxPx, rawPx))
          latestWidth = toUnit(clamped, unit)
          propsRef.current.onResize(latestWidth, { syncState: false })
        }
        return
      }

      if (canToggle && rawPx < minPx * 0.6) {
        collapsed = true
        lastToggleTime = now
        referenceX = evt.clientX
        setDragging(false)
        propsRef.current.onToggle?.()
        return
      }

      const clamped = Math.max(minPx, Math.min(maxPx, rawPx))
      latestWidth = toUnit(clamped, unit)
      propsRef.current.onResize(latestWidth, { syncState: false })
    }

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      document.body.style.removeProperty('cursor')
      document.body.style.removeProperty('user-select')
      setDragging(false)

      if (!dragged) {
        if (propsRef.current.enableToggle) {
          propsRef.current.onToggle?.()
        }
        return
      }

      if (!collapsed) {
        propsRef.current.onResize(latestWidth, { syncState: true })
      }
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  return { dragRef, onMouseDown }
}
