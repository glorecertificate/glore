'use client'

import { createContext, use, useState } from 'react'

interface ApplicationContext {
  setStepIndex: React.Dispatch<React.SetStateAction<number>>
  stepIndex: number
}

const ApplicationContext = createContext<ApplicationContext | null>(null)

export const ApplicationProvider = ({ children }: { children: React.ReactNode }) => {
  const [stepIndex, setStepIndex] = useState(0)
  return <ApplicationContext value={{ setStepIndex, stepIndex }}>{children}</ApplicationContext>
}

export const useApplicationStep = () => {
  const context = use(ApplicationContext)
  if (!context) throw new Error('useApplicationStep must be used within ApplicationProvider')
  return context
}
