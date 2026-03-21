'use client'

import { useContext } from 'react'

import { PWAContext } from '@/components/providers/pwa-context'

export const usePWAContext = () => {
  const context = useContext(PWAContext)
  if (!context) throw new Error('usePWAContext must be used within a PWAContextProvider')
  return context
}
