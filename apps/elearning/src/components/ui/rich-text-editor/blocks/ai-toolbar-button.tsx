'use client'

import { AIChatPlugin } from '@platejs/ai/react'
import { useEditorPlugin } from 'platejs/react'

import { ToolbarButton } from '@rte/blocks/toolbar'

export const AIToolbarButton = (props: React.ComponentProps<typeof ToolbarButton>) => {
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
