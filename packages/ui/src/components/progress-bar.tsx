'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { cn } from '@repo/ui/utils'

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

  const start = useCallback(() => {
    setState('in-progress')
  }, [])

  const done = useCallback(() => {
    setState('complete')
  }, [])

  const reset = useCallback(() => {
    setValue(0)
    setState('initial')
  }, [])

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
    [colorize, done, reset, start, state, value, variant],
  )

  return <ProgressBarContext.Provider value={contextValue} {...props} />
}

export interface ProgressBarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressBarVariants> {}

export const ProgressBar = ({ children, className, variant, ...props }: ProgressBarProps) => {
  const { state, value = 10 } = useProgressBar()

  return (
    <>
      {state !== 'initial' && (
        <div className={cn(progressBarVariants({ variant }), className)} style={{ width: `${value}%` }} {...props} />
      )}
      {children}
    </>
  )
}

export const progressBarVariants = cva('fixed z-50 h-1 transition-all duration-300 ease-in-out', {
  defaultVariants: {
    variant: 'default',
  },
  variants: {
    variant: {
      default: '',
      link: 'text-link',
      primary: 'text-brand hover:text-brand-accent',
      secondary: 'text-brand-secondary hover:text-brand-secondary-accent',
      tertiary: 'text-brand-tertiary hover:text-brand-tertiary-accent',
      destructive: 'text-destructive hover:text-destructive',
      success: 'text-success hover:text-success',
      transparent: 'text-transparent hover:text-foreground',
      muted: 'text-muted-foreground hover:text-foreground/90',
    },
  },
})
