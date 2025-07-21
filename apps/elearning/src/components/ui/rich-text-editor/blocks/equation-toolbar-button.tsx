'use client'

import { insertInlineEquation } from '@platejs/math'
import { RadicalIcon } from 'lucide-react'
import { useEditorRef } from 'platejs/react'

import { ToolbarButton } from '#rte/blocks/toolbar'

export const InlineEquationToolbarButton = (props: React.ComponentProps<typeof ToolbarButton>) => {
  const editor = useEditorRef()

  return (
    <ToolbarButton
      {...props}
      onClick={() => {
        insertInlineEquation(editor)
      }}
      tooltip="Mark as equation"
    >
      <RadicalIcon />
    </ToolbarButton>
  )
}
