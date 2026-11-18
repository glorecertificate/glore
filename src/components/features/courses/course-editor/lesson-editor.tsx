'use client'

import { useEffect } from 'react'

import { useEditorRef } from 'platejs/react'

import { BlockActions } from '@/components/features/courses/course-editor/block-actions'
import { RichTextEditor } from '@/components/ui/rich-text-editor'

const TOUCH_TOOLBAR =
  'max-lg:[&>div]:overflow-y-visible max-lg:[&_[role=toolbar].sticky]:overflow-x-auto max-lg:[&_[role=toolbar].sticky>div]:w-max max-lg:[&_[role=toolbar].sticky>div]:flex-nowrap pointer-coarse:[&_[role=toolbar].absolute]:hidden'

export const LessonEditor = (props: Omit<React.ComponentProps<typeof RichTextEditor>, 'autoFocus'>) => {
  const editor = useEditorRef()

  useEffect(() => {
    const active = document.activeElement
    if (active && active !== document.body) return
    editor.api.toDOMNode(editor)?.focus()
  }, [editor])

  return (
    <div className={TOUCH_TOOLBAR}>
      <BlockActions className="mb-2" />
      <RichTextEditor {...props} />
    </div>
  )
}
