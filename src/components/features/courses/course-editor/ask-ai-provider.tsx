'use client'

import { createContext, use, useState } from 'react'

type AskAIAction = () => void

interface AskAIState {
  action: AskAIAction | null
  setAction: React.Dispatch<React.SetStateAction<AskAIAction | null>>
}

const AskAIContext = createContext<AskAIState | null>(null)

export const AskAIProvider = ({ children }: React.PropsWithChildren) => {
  const [action, setAction] = useState<AskAIAction | null>(null)

  return <AskAIContext value={{ action, setAction }}>{children}</AskAIContext>
}

export const useAskAI = () => use(AskAIContext)
