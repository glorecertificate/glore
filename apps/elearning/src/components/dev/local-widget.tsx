'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { type SlotProps } from '@radix-ui/react-slot'
import { MoveIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useCookies } from '@/hooks/use-cookies'
import { type Cookie } from '@/lib/storage'
import { cn } from '@/lib/utils'

export interface LocalWidgetProps extends SlotProps {
  /** @default true */
  asChild?: boolean
  /** Key for storing the widget position */
  cookie?: Cookie
  /** @default { x: 100, y: 100 } */
  defaultPosition?: {
    x: number
    y: number
  }
}

export const LocalWidget = ({
  children,
  className,
  cookie,
  defaultPosition = {
    x: 100,
    y: 100,
  },
  ...props
}: LocalWidgetProps) => {
  const { setCookie } = useCookies()

  const [position, setPosition] = useState(defaultPosition)
  const [isDragging, setIsDragging] = useState(false)

  const ref = useRef<HTMLDivElement>(null)
  const dragStart = useRef({ x: 0, y: 0 })
  const isDraggingRef = useRef(false)

  const onMouseUp = useCallback(() => {
    setIsDragging(false)
    isDraggingRef.current = false
  }, [])

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true)
      isDraggingRef.current = true
      dragStart.current = {
        x: e.clientX - (position?.x ?? 0),
        y: e.clientY - (position?.y ?? 0),
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
        x: touch.clientX - (position?.x ?? 0),
        y: touch.clientY - (position?.y ?? 0),
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
    if (cookie) {
      setCookie(cookie, JSON.stringify(position))
    }
  }, [cookie, position, setCookie])

  return (
    <div
      className={cn(
        'group fixed z-50 transition-none',
        isDragging ? 'scale-105 will-change-transform' : 'will-change-auto',
        className,
      )}
      ref={ref}
      style={{
        left: `${position?.x ?? 0}px`,
        top: `${position?.y ?? 0}px`,
      }}
      {...props}
    >
      <div className="relative">
        <Button
          className={cn(
            'absolute top-0 -right-3 h-auto cursor-move p-0 opacity-0 group-hover:opacity-100',
            isDragging && 'scale-100 cursor-grabbing',
          )}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          variant="transparent"
        >
          <MoveIcon size={16} />
        </Button>
        {children}
      </div>
    </div>
  )
}
