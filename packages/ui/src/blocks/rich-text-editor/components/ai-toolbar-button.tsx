'use client'

import { AIChatPlugin } from '@platejs/ai/react'
import { useEditorPlugin } from 'platejs/react'

import { ToolbarButton, type ToolbarButtonProps } from '@repo/ui/components/toolbar'

export const AIToolbarButton = (props: ToolbarButtonProps) => {
  const { api } = useEditorPlugin(AIChatPlugin)

  return (
    <ToolbarButton
      {...props}
      onClick={() => {
        api.aiChat.show()
      }}
      onMouseDown={e => {
        e.preventDefault()
      }}
    />
  )
}
