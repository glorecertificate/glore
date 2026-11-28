'use client'

import { useEffect, useState } from 'react'

import { AIChatPlugin } from '@platejs/ai/react'
import { useEditorRef, usePlateState } from 'platejs/react'

import { useAskAI } from '@/components/features/courses/course-editor/ask-ai-provider'
import { useTouchBlockDrag } from '@/components/features/courses/course-editor/use-touch-block-drag'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { finePointer } from '@/lib/pointer'

const TOUCH_TOOLBAR =
  'max-xl:[&>div]:overflow-y-visible max-xl:[&_[role=toolbar].sticky]:overflow-x-auto max-xl:[&_[role=toolbar].sticky>div]:w-max max-xl:[&_[role=toolbar].sticky>div]:flex-nowrap [&_[role=toolbar].sticky]:overflow-y-hidden [&_[role=toolbar].sticky>div]:overflow-y-hidden pointer-coarse:[&_[role=toolbar].absolute]:hidden pointer-coarse:[&_[role=toolbar].sticky_button:has(>.lucide-wand-sparkles)]:hidden [&_.slate-blockToolbar>button]:touch-hit pointer-coarse:[&_.slate-blockToolbar>button]:touch-none pointer-coarse:[&_.slate-blockToolbar]:w-7 pointer-coarse:[&_.slate-blockToolbar>button]:h-8 pointer-coarse:[&_.slate-blockToolbar>button]:select-none pointer-coarse:[&_.slate-blockToolbar>button]:[-webkit-touch-callout:none] pointer-coarse:[&_.slate-blockToolbar>button]:[-webkit-user-drag:none] pointer-coarse:[&_.slate-blockToolbar_svg]:size-5 **:data-slate-placeholder:text-fg-placeholder!'

export const LessonEditor = (props: Omit<React.ComponentProps<typeof RichTextEditor>, 'autoFocus'>) => {
  const editor = useEditorRef()
  const [readOnly] = usePlateState('readOnly')
  const [root, setRoot] = useState<HTMLDivElement | null>(null)
  const setAskAI = useAskAI()?.setAction

  useTouchBlockDrag(editor, readOnly ? null : root)

  useEffect(() => {
    const active = document.activeElement
    if (!finePointer() || (active && active !== document.body)) return
    editor.api.toDOMNode(editor)?.focus({ preventScroll: true })
  }, [editor])

  useEffect(() => {
    if (!setAskAI || readOnly) return
    setAskAI(() => () => {
      editor.tf.focus()
      editor.getApi(AIChatPlugin).aiChat.show()
    })
    return () => setAskAI(null)
  }, [editor, readOnly, setAskAI])

  return (
    <div className={TOUCH_TOOLBAR} ref={setRoot}>
      <RichTextEditor {...props} />
    </div>
  )
}
