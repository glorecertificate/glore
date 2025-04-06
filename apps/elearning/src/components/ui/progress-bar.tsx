'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { useNavigation } from '@/hooks/use-navigation'
import { Route } from '@/lib/navigation'
import { type ColorVariant } from '@/lib/theme'
import { cn } from '@/lib/utils'

export enum ProgressBarState {
  Initial = 'initial',
  InProgress = 'in-progress',
  Complete = 'complete',
}

interface ProgressBarContext {
  color?: ColorVariant
  colorize: (color?: ColorVariant | null) => void
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
  const [color, setColor] = useState<ColorVariant | undefined>(undefined)
  const [state, setState] = useState<ProgressBarState>(ProgressBarState.Initial)
  const [value, setValue] = useState(0)

  useEffect(() => {
    const t = setInterval(
      () => {
        if (state === ProgressBarState.Complete) {
          setValue(100)
          clearInterval(t)
          return
        }
        if (value >= 60 && value < 80) return setValue(value + 2)
        if (value >= 80 && value < 95) return setValue(value + 0.5)
        if (value >= 95) return setValue(95)
        setValue(value + 5)
      },
      state === ProgressBarState.InProgress ? 600 : 0,
    )

    return () => clearInterval(t)
  }, [state, value])

  const start = useCallback(
    () => () => {
      setState(ProgressBarState.InProgress)
    },
    [],
  )

  const done = useCallback(() => {
    setState(ProgressBarState.Complete)
  }, [])

  const reset = useCallback(() => {
    setValue(0)
    setState(ProgressBarState.Initial)
  }, [])

  const colorize = useCallback((color?: ColorVariant | null) => {
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
  const { pathname } = useNavigation()
  const { color, state, value = 10 } = useProgressBar()

  const isGradient = useMemo(() => !color && pathname === Route.Home, [color, pathname])

  return (
    <>
      {state !== ProgressBarState.Initial && (
        <div
          className={cn(
            'fixed z-50 h-1 transition-all duration-300 ease-in-out',
            color ? `bg-${color}` : 'bg-foreground/30',
            isGradient && 'bg-gradient-to-tr from-primary via-secondary to-tertiary',
          )}
          style={{ width: `${value}%` }}
        />
      )}
      {children}
    </>
  )
}
