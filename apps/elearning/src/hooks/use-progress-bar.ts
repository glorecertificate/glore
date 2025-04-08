'use client'

import { useContext } from 'react'

import { ProgressBarContext } from '@/components/providers/progress-bar-provider'

export const useProgressBar = () => {
  const context = useContext(ProgressBarContext)
  if (!context) throw new Error('useProgressBar must be used within a ProgressBarProvider')
  return context
}
