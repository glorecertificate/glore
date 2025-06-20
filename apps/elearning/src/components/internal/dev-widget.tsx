'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { type SlotProps } from '@radix-ui/react-slot'
import { MoveIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { LocalStorage } from '@/lib/storage'
import { cn } from '@/lib/utils'

const DEFAULT_POSITION = { x: 100, y: 100 }

export interface DevWidgetWidgetProps extends SlotProps {
  /** @default true */
  asChild?: boolean
  /** @default { x: 100, y: 100 } */
  defaultPosition?: {
    x: number
    y: number
  }
  onRelease?: (position: { x: number; y: number }) => void
  storageKey?: LocalStorage | `${LocalStorage}`
}

export const DevWidget = ({
  children,
  className,
  defaultPosition,
  onRelease,
  storageKey,
  ...props
}: DevWidgetWidgetProps) => {
  const [isDragging, setIsDragging] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const dragStart = useRef({ x: 0, y: 0 })
  const isDraggingRef = useRef(false)

  const initialPosition = useMemo(() => {
    if (defaultPosition) return defaultPosition
    if (!storageKey) return DEFAULT_POSITION
    const savedPosition = localStorage.getItem(storageKey)
    return savedPosition ? (JSON.parse(savedPosition) as { x: number; y: number }) : DEFAULT_POSITION
  }, [defaultPosition, storageKey])

  const [position, setPosition] = useState(initialPosition)

  const onMouseUp = useCallback(() => {
    setIsDragging(false)
    isDraggingRef.current = false
    if (storageKey) localStorage.setItem(storageKey, JSON.stringify(position))
    if (onRelease && ref.current) onRelease(position)
  }, [onRelease, position, storageKey])

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true)
      isDraggingRef.current = true
      dragStart.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      }
      e.preventDefault()
    },
    [position],
  )

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current || !ref.current) return
    const element = ref.current
    const elementWidth = element.offsetWidth
    const elementHeight = element.offsetHeight
    const newX = Math.max(0, Math.min(window.innerWidth - elementWidth, e.clientX - dragStart.current.x))
    const newY = Math.max(0, Math.min(window.innerHeight - elementHeight, e.clientY - dragStart.current.y))
    setPosition({ x: newX, y: newY })
  }, [])

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0]
      setIsDragging(true)
      isDraggingRef.current = true
      dragStart.current = {
        x: touch.clientX - position.x,
        y: touch.clientY - position.y,
      }
      e.preventDefault()
    },
    [position],
  )

  const onTouchEnd = useCallback((e: TouchEvent) => {
    setIsDragging(false)
    isDraggingRef.current = false
    e.preventDefault()
  }, [])

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!isDraggingRef.current || !ref.current) return
    const touch = e.touches[0]
    const element = ref.current
    const elementWidth = element.offsetWidth
    const elementHeight = element.offsetHeight
    const newX = Math.max(0, Math.min(window.innerWidth - elementWidth, touch.clientX - dragStart.current.x))
    const newY = Math.max(0, Math.min(window.innerHeight - elementHeight, touch.clientY - dragStart.current.y))
    setPosition({ x: newX, y: newY })
    e.preventDefault()
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
      document.addEventListener('touchmove', onTouchMove, { passive: false })
      document.addEventListener('touchend', onTouchEnd)
      return () => {
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
        document.removeEventListener('touchmove', onTouchMove)
        document.removeEventListener('touchend', onTouchEnd)
      }
    }
  }, [isDragging, onMouseMove, onMouseUp, onTouchMove, onTouchEnd])

  useEffect(() => {
    const savedPosition = localStorage.getItem(LocalStorage.SupabaseWidgetPosition)
    if (savedPosition) setPosition(JSON.parse(savedPosition) as { x: number; y: number })
  }, [])

  useEffect(() => {
    localStorage.setItem(LocalStorage.SupabaseWidgetPosition, JSON.stringify(position))
  }, [position])

  return (
    <div
      className={cn(
        'group fixed z-50 transition-none',
        isDragging ? 'scale-105 will-change-transform' : 'will-change-auto',
        className,
      )}
      ref={ref}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      {...props}
    >
      <div className="relative">
        <Button
          className={cn(
            'absolute top-0 -right-3 h-auto cursor-move p-0 opacity-0 group-hover:opacity-100',
            isDragging && 'scale-100',
          )}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
        >
          <MoveIcon size={16} />
        </Button>
        {children}
      </div>
    </div>
  )
}
