import { useCallback, useEffect, useMemo, useRef } from 'react'

import { useCookies } from '@/hooks/use-cookies'

export interface UseSidebarResizeProps {
  autoCollapseThreshold?: number
  currentWidth: string
  direction?: 'left' | 'right'
  enableAutoCollapse?: boolean
  enableDrag?: boolean
  enableToggle?: boolean
  expandThreshold?: number
  isCollapsed?: boolean
  isNested?: boolean
  maxResizeWidth?: string
  minResizeWidth?: string
  onResize: (width: string, options?: { syncState?: boolean }) => void
  onToggle?: () => void
  setIsDraggingRail?: (isDragging: boolean) => void
}

const parseWidth = (width: string) => {
  const unit = width.endsWith('rem') ? 'rem' : 'px'
  const value = Number.parseFloat(width)
  return { value, unit }
}

const toPx = (width: string) => {
  const { value, unit } = parseWidth(width)
  return unit === 'rem' ? value * 16 : value
}

const formatWidth = (value: number, unit: string) => {
  if (unit === 'rem') {
    const precise = Number.parseFloat(value.toFixed(3))
    return `${precise}${unit}`
  }
  return `${Math.round(value)}${unit}`
}

/**
 * Hook for handling resizable sidebars, working for both sidebar (left side) and artifacts (right side) panels.
 * Supports VS Code-like continuous drag to collapse/expand.
 */
export function useSidebarResize({
  autoCollapseThreshold = 1.5,
  currentWidth,
  direction = 'right',
  enableAutoCollapse = true,
  enableDrag = true,
  enableToggle = true,
  expandThreshold = 0.2,
  isCollapsed = false,
  isNested = false,
  maxResizeWidth = '24rem',
  minResizeWidth = '14rem',
  onResize,
  onToggle,
  setIsDraggingRail = () => {},
}: UseSidebarResizeProps) {
  const cookies = useCookies()

  const dragRef = useRef<HTMLButtonElement>(null)
  const startWidth = useRef(0)
  const startX = useRef(0)
  const isDragging = useRef(false)
  const isInteractingWithRail = useRef(false)
  const lastWidth = useRef(0)
  const lastLoggedWidth = useRef(0)
  const dragStartPoint = useRef(0)
  const lastDragDirection = useRef<'expand' | 'collapse' | null>(null)
  const lastTogglePoint = useRef(0)
  const lastToggleWidth = useRef(0)
  const toggleCooldown = useRef(false)
  const lastToggleTime = useRef(0)
  const dragDistanceFromToggle = useRef(0)
  const dragOffset = useRef(0)
  const railRect = useRef<DOMRect | null>(null)
  const autoCollapseThresholdPx = useRef(0)
  const resizeAnimationFrame = useRef<number | null>(null)
  const pendingWidth = useRef<string | null>(null)
  const latestWidth = useRef(currentWidth)
  const shouldRestoreRail = useRef(false)

  const minWidthPx = useMemo(() => toPx(minResizeWidth), [minResizeWidth])
  const maxWidthPx = useMemo(() => toPx(maxResizeWidth), [maxResizeWidth])

  const isIncreasingWidth = useCallback(
    (currentX: number, referenceX: number): boolean =>
      direction === 'left' ? currentX < referenceX : currentX > referenceX,
    [direction]
  )

  const calculateWidth = useCallback(
    (e: MouseEvent, initialX: number, initialWidth: number, currentRailRect: DOMRect | null) => {
      if (isNested && currentRailRect) {
        const deltaX = e.clientX - initialX
        return direction === 'left' ? initialWidth - deltaX : initialWidth + deltaX
      }
      if (direction === 'left') {
        return window.innerWidth - e.clientX
      }
      return e.clientX
    },
    [direction, isNested]
  )

  useEffect(() => {
    autoCollapseThresholdPx.current = enableAutoCollapse ? minWidthPx * autoCollapseThreshold : 0
  }, [minWidthPx, enableAutoCollapse, autoCollapseThreshold])

  useEffect(() => {
    latestWidth.current = currentWidth
  }, [currentWidth])

  const commitResize = useCallback(
    (width: string, options?: { syncState?: boolean }) => {
      latestWidth.current = width
      onResize(width, options)
    },
    [onResize]
  )

  const flushResize = useCallback(
    (options?: { syncState?: boolean }) => {
      if (resizeAnimationFrame.current !== null) {
        if (typeof cancelAnimationFrame === 'function') {
          cancelAnimationFrame(resizeAnimationFrame.current)
        }
        resizeAnimationFrame.current = null
      }
      const widthToCommit = pendingWidth.current ?? latestWidth.current
      pendingWidth.current = null
      if (widthToCommit) {
        commitResize(widthToCommit, options)
      }
    },
    [commitResize]
  )

  const scheduleResize = useCallback(
    (width: string) => {
      pendingWidth.current = width
      latestWidth.current = width
      if (typeof requestAnimationFrame !== 'function') {
        commitResize(width, { syncState: false })
        pendingWidth.current = null
        return
      }
      if (resizeAnimationFrame.current !== null) return
      resizeAnimationFrame.current = requestAnimationFrame(() => {
        resizeAnimationFrame.current = null
        if (pendingWidth.current !== null) {
          commitResize(pendingWidth.current, { syncState: false })
          pendingWidth.current = null
        }
      })
    },
    [commitResize]
  )

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isInteractingWithRail.current = true
      if (!enableDrag) return

      const currentWidthPx = isCollapsed ? 0 : toPx(currentWidth)
      startWidth.current = currentWidthPx
      startX.current = e.clientX
      dragStartPoint.current = e.clientX
      lastWidth.current = currentWidthPx
      lastLoggedWidth.current = currentWidthPx
      lastTogglePoint.current = e.clientX
      lastToggleWidth.current = currentWidthPx
      lastDragDirection.current = null
      toggleCooldown.current = false
      lastToggleTime.current = 0
      dragDistanceFromToggle.current = 0
      dragOffset.current = 0
      railRect.current = isNested && dragRef.current ? dragRef.current.getBoundingClientRect() : null

      e.preventDefault()
    },
    [enableDrag, isCollapsed, currentWidth, isNested]
  )

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isInteractingWithRail.current) return

      const deltaX = Math.abs(e.clientX - startX.current)

      if (!isDragging.current && deltaX > 5) {
        isDragging.current = true
        setIsDraggingRail(true)
      }

      if (shouldRestoreRail.current && isDragging.current) {
        shouldRestoreRail.current = false
        setIsDraggingRail(true)
      }

      if (isDragging.current) {
        const { unit } = parseWidth(currentWidth)

        let currentRailRect = railRect.current
        if (isNested && dragRef.current) {
          currentRailRect = dragRef.current.getBoundingClientRect()
        }

        const currentDragDirection = isIncreasingWidth(e.clientX, lastTogglePoint.current) ? 'expand' : 'collapse'

        if (lastDragDirection.current !== currentDragDirection) {
          lastDragDirection.current = currentDragDirection
        }

        dragDistanceFromToggle.current = Math.abs(e.clientX - lastTogglePoint.current)

        const now = Date.now()
        if (toggleCooldown.current && now - lastToggleTime.current > 200) {
          toggleCooldown.current = false
        }

        if (!toggleCooldown.current) {
          if (enableAutoCollapse && onToggle && !isCollapsed) {
            const currentDragWidth = calculateWidth(e, startX.current, startWidth.current, currentRailRect)

            let shouldCollapse = false

            if (autoCollapseThreshold <= 1.0) {
              shouldCollapse = currentDragWidth <= minWidthPx * autoCollapseThreshold
            }
            if (autoCollapseThreshold > 1.0 && currentDragWidth <= minWidthPx) {
              const extraDragNeeded = minWidthPx * (autoCollapseThreshold - 1.0)
              const distanceBeyondMin = minWidthPx - currentDragWidth
              shouldCollapse = distanceBeyondMin >= extraDragNeeded
            }

            if (currentDragDirection === 'collapse' && shouldCollapse) {
              flushResize()
              shouldRestoreRail.current = true
              setIsDraggingRail(false)
              onToggle()
              lastTogglePoint.current = e.clientX
              lastToggleWidth.current = 0
              toggleCooldown.current = true
              lastToggleTime.current = now
              return
            }
          }

          if (
            onToggle &&
            isCollapsed &&
            currentDragDirection === 'expand' &&
            dragDistanceFromToggle.current > minWidthPx * expandThreshold
          ) {
            flushResize()
            onToggle()

            const initialWidth = calculateWidth(e, startX.current, startWidth.current, currentRailRect)
            const clampedWidth = Math.max(minWidthPx, Math.min(maxWidthPx, initialWidth))

            const formattedWidth = formatWidth(unit === 'rem' ? clampedWidth / 16 : clampedWidth, unit)
            scheduleResize(formattedWidth)

            lastTogglePoint.current = e.clientX
            lastToggleWidth.current = clampedWidth
            toggleCooldown.current = true
            lastToggleTime.current = now
            return
          }
        }

        if (isCollapsed) return

        const newWidthPx = calculateWidth(e, startX.current, startWidth.current, currentRailRect)
        const clampedWidthPx = Math.max(minWidthPx, Math.min(maxWidthPx, newWidthPx))
        const newWidth = unit === 'rem' ? clampedWidthPx / 16 : clampedWidthPx
        const formattedWidth = formatWidth(newWidth, unit)
        scheduleResize(formattedWidth)

        lastWidth.current = clampedWidthPx
      }
    },
    [
      onToggle,
      isCollapsed,
      currentWidth,
      minWidthPx,
      maxWidthPx,
      isIncreasingWidth,
      calculateWidth,
      isNested,
      enableAutoCollapse,
      autoCollapseThreshold,
      expandThreshold,
      setIsDraggingRail,
      flushResize,
      scheduleResize,
    ]
  )

  const handleMouseUp = useCallback(() => {
    if (!isInteractingWithRail.current) return

    flushResize({ syncState: true })

    if (!isDragging.current && onToggle && enableToggle) {
      onToggle()
    }

    cookies.set('sidebar_width', latestWidth.current)
    isDragging.current = false
    isInteractingWithRail.current = false
    lastWidth.current = 0
    lastLoggedWidth.current = 0
    lastDragDirection.current = null
    lastTogglePoint.current = 0
    lastToggleWidth.current = 0
    toggleCooldown.current = false
    lastToggleTime.current = 0
    dragDistanceFromToggle.current = 0
    dragOffset.current = 0
    railRect.current = null
    shouldRestoreRail.current = false
    setIsDraggingRail(false)
  }, [onToggle, enableToggle, setIsDraggingRail, cookies.set, flushResize])

  useEffect(() => {
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      flushResize()
    }
  }, [flushResize, handleMouseUp, onMouseMove])

  return {
    dragRef,
    isDragging,
    onMouseDown,
  }
}
