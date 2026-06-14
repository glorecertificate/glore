'use client'

import { useEffect, useRef, useState } from 'react'

import { usePlateState } from 'platejs/react'

import { Toolbar } from '@/components/ui/toolbar'
import { cn } from '@/lib/utils'

export const FixedToolbar = ({ className, ...props }: React.ComponentProps<typeof Toolbar>) => {
  const ref = useRef<HTMLDivElement>(null)
  const [readOnly] = usePlateState('readOnly')

  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const update = () => {
      const scrollable = element.clientWidth !== element.scrollWidth
      setCanScrollLeft(scrollable && element.scrollLeft > 0)
      setCanScrollRight(scrollable && element.scrollWidth > element.clientWidth + element.scrollLeft)
    }

    update()
    element.addEventListener('scroll', update, { passive: true })
    const observer = new ResizeObserver(update)
    observer.observe(element)

    return () => {
      element.removeEventListener('scroll', update)
      observer.disconnect()
    }
  }, [])

  return (
    <>
      <Toolbar
        className={cn(
          'sticky top-0 left-0 scrollbar-hide w-full justify-between overflow-x-hidden rounded-t-lg border border-b-0 border-border bg-input/30 p-1 backdrop-blur-sm supports-backdrop-blur:bg-background/60',
          readOnly && 'hidden',
          className
        )}
        ref={ref}
        {...props}
      />
      {(canScrollLeft || canScrollRight) && (
        <div className="absolute">
          {canScrollLeft && (
            <div className="absolute top-0 left-0 h-full w-8 bg-linear-to-r from-background/95 to-background/0" />
          )}
          {canScrollRight && (
            <div className="absolute top-0 right-0 h-full w-8 bg-linear-to-l from-background/95 to-background/0" />
          )}
        </div>
      )}
    </>
  )
}
