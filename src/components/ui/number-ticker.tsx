'use client'

import { useEffect, useRef } from 'react'

import { animate, useMotionValue, useMotionValueEvent, useReducedMotion } from 'motion/react'
import { useFormatter } from 'next-intl'

import { TRANSITION } from '@/lib/motion'
import { cn } from '@/lib/utils'

export const NumberTicker = ({
  className,
  format,
  value,
  ...props
}: Omit<React.ComponentProps<'span'>, 'children'> & {
  format?: Parameters<ReturnType<typeof useFormatter>['number']>[2]
  value: number
}) => {
  const { number } = useFormatter()
  const reducedMotion = useReducedMotion()
  const current = useMotionValue(0)
  const text = useRef<HTMLSpanElement>(null)

  useMotionValueEvent(current, 'change', latest => {
    if (text.current) text.current.textContent = number(latest, format ?? {})
  })

  useEffect(() => {
    const animation = animate(current, value, { ...TRANSITION, duration: reducedMotion ? 0 : TRANSITION.duration })
    return () => animation.stop()
  }, [current, reducedMotion, value])

  return (
    <span className={cn('tabular-nums', className)} data-slot="number-ticker" {...props}>
      <span aria-hidden ref={text}>
        {number(value, format ?? {})}
      </span>
      <span className="sr-only">{number(value, format ?? {})}</span>
    </span>
  )
}
