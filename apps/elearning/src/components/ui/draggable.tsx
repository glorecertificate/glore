'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Slot, type SlotProps } from '@radix-ui/react-slot'

import { type LocalStorage } from '@/lib/storage'
import { cn } from '@/lib/utils'

export interface DraggableProps extends SlotProps {
  /** @default true */
  asChild?: boolean
  /** @default { x: 100, y: 100 } */
  defaultPosition?: {
    x: number
    y: number
  }
  handle: React.ReactNode
  onRelease?: (position: { x: number; y: number }) => void
  storageKey?: LocalStorage | `${LocalStorage}`
}

export const Draggable = ({
  asChild = true,
  children,
  className,
  defaultPosition,
  onRelease,
  storageKey,
  ...props
}: DraggableProps) => {
  const [isDragging, setIsDragging] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const dragStart = useRef({ x: 0, y: 0 })
  const isDraggingRef = useRef(false)

  const Component = useMemo(() => (asChild ? Slot : 'div'), [asChild])

  const initialPosition = useMemo(() => {
    if (defaultPosition) return defaultPosition
    if (storageKey) {
      const savedPosition = localStorage.getItem(storageKey as string)
      if (savedPosition) return JSON.parse(savedPosition) as { x: number; y: number }
    }
    return { x: 100, y: 100 }
  }, [defaultPosition, storageKey])

  const [position, setPosition] = useState(initialPosition)

  const onMouseUp = useCallback(() => {
    setIsDragging(false)
    isDraggingRef.current = false
    if (storageKey) localStorage.setItem(storageKey as string, JSON.stringify(position))
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

  return (
    <Component
      className={cn(
        'fixed z-50 transition-none',
        isDragging ? 'scale-110 cursor-grabbing! will-change-transform' : 'cursor-grab! will-change-auto',
        className,
      )}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      ref={ref}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      {...props}
    >
      {children}
    </Component>
  )
}
