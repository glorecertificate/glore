'use client'

import { useEffect } from 'react'

import { useEditorRef } from 'platejs/react'

import { RichTextEditor } from '@/components/ui/rich-text-editor'

export const LessonEditor = (props: Omit<React.ComponentProps<typeof RichTextEditor>, 'autoFocus'>) => {
  const editor = useEditorRef()

  useEffect(() => {
    const active = document.activeElement
    if (active && active !== document.body) return
    editor.api.toDOMNode(editor)?.focus()
  }, [editor])

  return <RichTextEditor {...props} />
}
