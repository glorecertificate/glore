'use client'

import { Redo2Icon, Undo2Icon } from 'lucide-react'
import { useEditorRef, useEditorSelector } from 'platejs/react'

import { ToolbarButton } from '@repo/ui/components/toolbar'

import { useI18n } from '../hooks/use-i18n'

export const RedoToolbarButton = (props: React.ComponentProps<typeof ToolbarButton>) => {
  const editor = useEditorRef()
  const disabled = useEditorSelector(editor => editor.history.redos.length === 0, [])
  const { t } = useI18n('actions')

  return (
    <ToolbarButton
      {...props}
      disabled={disabled}
      onClick={() => editor.redo()}
      onMouseDown={e => e.preventDefault()}
      tooltip={t.redo}
    >
      <Redo2Icon />
    </ToolbarButton>
  )
}

export const UndoToolbarButton = (props: React.ComponentProps<typeof ToolbarButton>) => {
  const { t } = useI18n('actions')
  const editor = useEditorRef()
  const disabled = useEditorSelector(editor => editor.history.undos.length === 0, [])

  return (
    <ToolbarButton
      {...props}
      disabled={disabled}
      onClick={() => editor.undo()}
      onMouseDown={e => e.preventDefault()}
      tooltip={t.undo}
    >
      <Undo2Icon />
    </ToolbarButton>
  )
}
