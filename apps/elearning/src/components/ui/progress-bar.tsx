'use client'

import { useProgressBar } from '@/hooks/use-progress-bar'

export const ProgressBar = ({ children }: React.PropsWithChildren) => {
  const { state, value = 10 } = useProgressBar()

  return (
    <>
      {state !== 'initial' && (
        <div
          className="fixed z-50 h-1 bg-gradient-to-tr from-primary via-secondary to-tertiary transition-all duration-300 ease-in-out"
          style={{ width: `${value}%` }}
        />
      )}
      {children}
    </>
  )
}
