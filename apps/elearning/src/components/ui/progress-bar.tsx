'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

import { cva, type VariantProps } from 'class-variance-authority'

import { random } from '@glore/utils/random'

import { cn } from '@/lib/utils'

export type ProgressBarState = 'initial' | 'in-progress' | 'complete'

export type ProgressBarVariant = VariantProps<typeof progressBarVariants>['variant']

interface ProgressBarContext {
  /** @default null */
  colorize: (color?: ProgressBarVariant | null) => void
  done: () => void
  reset: () => void
  start: () => void
  state: ProgressBarState
  value: number
  variant: ProgressBarVariant
}

export const ProgressBarContext = createContext<ProgressBarContext | null>(null)

export const useProgressBar = () => {
  const context = useContext(ProgressBarContext)
  if (!context) throw new Error('useProgressBar must be used within a ProgressBarProvider')
  return context
}

export const ProgressBarProvider = (props: React.PropsWithChildren) => {
  const [variant, setVariant] = useState<ProgressBarVariant | null>(null)
  const [state, setState] = useState<ProgressBarState>('initial')
  const [value, setValue] = useState(0)

  const valueRef = useRef(value)
  const stateRef = useRef(state)
  const progressTimer = useRef<NodeJS.Timeout | null>(null)
  const completionFrame = useRef<number | null>(null)
  const stallThresholdRef = useRef(95)

  useEffect(() => {
    valueRef.current = value
  }, [value])

  useEffect(() => {
    stateRef.current = state
  }, [state])

  const clearScheduledTick = useCallback(() => {
    if (progressTimer.current) {
      clearTimeout(progressTimer.current)
      progressTimer.current = null
    }
  }, [])

  const cancelCompletion = useCallback(() => {
    if (completionFrame.current) {
      cancelAnimationFrame(completionFrame.current)
      completionFrame.current = null
    }
  }, [])

  const getNextIncrement = useCallback((current: number) => {
    if (current < 20) return random(0.5, 1.5)
    if (current < 45) return random(0.4, 1.2)
    if (current < 70) return random(0.3, 0.9)
    if (current < 90) return random(0.2, 0.6)
    return random(0.1, 0.3)
  }, [])

  const getNextDelay = useCallback((current: number) => {
    const pauseRoll = Math.random()
    if (pauseRoll < 0.15) return random(500, 1200)
    if (pauseRoll < 0.35) return random(250, 450)
    if (current < 40) return random(90, 160)
    if (current < 70) return random(120, 220)
    if (current < 90) return random(150, 260)
    return random(180, 320)
  }, [])

  const tick = useCallback(() => {
    progressTimer.current = null
    if (stateRef.current !== 'in-progress') return

    const current = valueRef.current
    if (current >= stallThresholdRef.current) return

    const nextValue = Math.min(stallThresholdRef.current, current + getNextIncrement(current))
    valueRef.current = nextValue
    setValue(nextValue)

    const delay = getNextDelay(nextValue)
    progressTimer.current = setTimeout(tick, delay)
  }, [getNextDelay, getNextIncrement])

  useEffect(() => {
    if (state !== 'in-progress') {
      return clearScheduledTick()
    }

    const initialDelay = getNextDelay(valueRef.current)
    progressTimer.current = setTimeout(tick, initialDelay)

    return clearScheduledTick
  }, [clearScheduledTick, getNextDelay, state, tick])

  useEffect(() => {
    if (state !== 'complete') {
      return cancelCompletion()
    }

    const animateToFinish = () => {
      const current = valueRef.current

      if (current >= 100) {
        return cancelCompletion()
      }

      const nextValue = Math.min(100, current + Math.max((100 - current) * 0.3, 0.6))
      valueRef.current = nextValue
      setValue(nextValue)

      completionFrame.current = requestAnimationFrame(animateToFinish)
    }

    completionFrame.current = requestAnimationFrame(animateToFinish)

    return cancelCompletion
  }, [cancelCompletion, state])

  const start = useCallback(() => {
    setValue(prev => {
      const nextValue = prev === 0 ? 2 : prev
      valueRef.current = nextValue
      return nextValue
    })
    stallThresholdRef.current = Math.max(valueRef.current + 1, random(92, 97))
    setState('in-progress')
  }, [])

  const done = useCallback(() => {
    setState('complete')
  }, [])

  const reset = useCallback(() => {
    clearScheduledTick()
    cancelCompletion()
    setValue(() => {
      valueRef.current = 0
      return 0
    })
    stallThresholdRef.current = 95
    setState('initial')
  }, [cancelCompletion, clearScheduledTick])

  const colorize = useCallback((variant: ProgressBarVariant | null) => {
    setVariant(variant)
  }, [])

  useEffect(() => {
    let t: NodeJS.Timeout

    if (value === 100) {
      t = setTimeout(() => {
        reset()
      }, 300)
    }

    return () => {
      clearTimeout(t)
    }
  }, [reset, value])

  const contextValue = useMemo<ProgressBarContext>(
    () => ({
      colorize,
      done,
      reset,
      start,
      state,
      value,
      variant,
    }),
    [colorize, done, reset, start, state, value, variant]
  )

  return <ProgressBarContext.Provider value={contextValue} {...props} />
}

export interface ProgressBarProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'>,
    VariantProps<typeof progressBarVariants> {}

export const ProgressBar = ({ className, variant, ...props }: ProgressBarProps) => {
  const { state, value = 10 } = useProgressBar()
  if (state === 'initial') return null
  return <div className={cn(progressBarVariants({ variant }), className)} style={{ width: `${value}%` }} {...props} />
}

export const progressBarVariants = cva('fixed z-50 h-1 transition-all duration-300 ease-in-out', {
  defaultVariants: {
    variant: 'default',
  },
  variants: {
    variant: {
      default: 'bg-foreground/30',
      link: 'bg-link',
      primary: 'bg-brand',
      secondary: 'bg-brand-secondary',
      tertiary: 'bg-brand-tertiary',
      destructive: 'bg-destructive',
      success: 'bg-success',
      transparent: 'bg-transparent',
      muted: 'bg-muted-foreground',
    },
  },
})
