'use client'

import { Redo2Icon, Undo2Icon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEditorRef, useEditorSelector } from 'platejs/react'

import { ToolbarButton } from '@/components/ui/toolbar'

export const RedoToolbarButton = (props: React.ComponentProps<typeof ToolbarButton>) => {
  const editor = useEditorRef()
  const disabled = useEditorSelector(editor => editor.history.redos.length === 0, [])
  const t = useTranslations('Components.RichTextEditor.actions')

  return (
    <ToolbarButton
      {...props}
      disabled={disabled}
      onClick={() => editor.redo()}
      onMouseDown={e => e.preventDefault()}
      tooltip={t('redo')}
    >
      <Redo2Icon />
    </ToolbarButton>
  )
}

export const UndoToolbarButton = (props: React.ComponentProps<typeof ToolbarButton>) => {
  const t = useTranslations('Components.RichTextEditor.actions')
  const editor = useEditorRef()
  const disabled = useEditorSelector(editor => editor.history.undos.length === 0, [])

  return (
    <ToolbarButton
      {...props}
      disabled={disabled}
      onClick={() => editor.undo()}
      onMouseDown={e => e.preventDefault()}
      tooltip={t('undo')}
    >
      <Undo2Icon />
    </ToolbarButton>
  )
}
