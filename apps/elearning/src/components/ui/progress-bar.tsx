'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { type LinkProps } from '@/components/ui/link'

export type ProgressBarColor = LinkProps['color']
export type ProgressBarState = 'initial' | 'in-progress' | 'complete'

interface ProgressBarContext {
  color?: ProgressBarColor
  colorize: (color?: ProgressBarColor | null) => void
  done: () => void
  reset: () => void
  start: () => void
  state: ProgressBarState
  value: number
}

export const ProgressBarContext = createContext<ProgressBarContext | null>(null)

export const useProgressBar = () => {
  const context = useContext(ProgressBarContext)
  if (!context) throw new Error('useProgressBar must be used within a ProgressBarProvider')
  return context
}

export const ProgressBarProvider = (props: React.PropsWithChildren) => {
  const [color, setColor] = useState<ProgressBarColor | undefined>(undefined)
  const [state, setState] = useState<ProgressBarState>('initial')
  const [value, setValue] = useState(0)

  useEffect(() => {
    const t = setInterval(
      () => {
        if (state === 'complete') {
          setValue(100)
          return clearInterval(t)
        }
        if (value >= 60 && value < 80) return setValue(value + 2)
        if (value >= 80 && value < 95) return setValue(value + 0.5)
        if (value >= 95) return setValue(95)
        setValue(value + 5)
      },
      state === 'in-progress' ? 600 : 0,
    )

    return () => clearInterval(t)
  }, [state, value])

  const start = useCallback(
    () => () => {
      setState('in-progress')
    },
    [],
  )

  const done = useCallback(() => {
    setState('complete')
  }, [])

  const reset = useCallback(() => {
    setValue(0)
    setState('initial')
  }, [])

  const colorize = useCallback((color?: ProgressBarColor | null) => {
    if (color) setColor(color)
  }, [])

  useEffect(() => {
    let t: NodeJS.Timeout

    if (value === 100) {
      t = setTimeout(() => {
        reset()
      }, 300)
    }

    return () => clearTimeout(t)
  }, [reset, value])

  const contextValue = useMemo<ProgressBarContext>(
    () => ({
      color,
      colorize,
      done,
      reset,
      start,
      state,
      value,
    }),
    [color, colorize, done, reset, start, state, value],
  )

  return <ProgressBarContext.Provider value={contextValue} {...props} />
}

export const ProgressBar = ({ children }: React.PropsWithChildren) => {
  const { state, value = 10 } = useProgressBar()

  return (
    <>
      {state !== 'initial' && (
        <div
          className="fixed z-50 h-1 bg-gradient-to-tr from-foreground/10 to-foreground/30 transition-all duration-300 ease-in-out"
          style={{ width: `${value}%` }}
        />
      )}
      {children}
    </>
  )
}
