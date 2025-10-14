'use client'

import { CopilotPlugin } from '@platejs/ai/react'
import { useElement, usePluginOption } from 'platejs/react'

export const GhostText = () => {
  const element = useElement()

  const isSuggested = usePluginOption(CopilotPlugin, 'isSuggested', element.id as string) as boolean

  if (!isSuggested) return null

  return <GhostTextContent />
}

const GhostTextContent = () => {
  const suggestionText = usePluginOption(CopilotPlugin, 'suggestionText')

  return (
    <span className="pointer-events-none text-muted-foreground/70 max-sm:hidden" contentEditable={false}>
      {suggestionText && suggestionText}
    </span>
  )
}
