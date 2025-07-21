'use client'

import { memo } from 'react'

import { useAIChatEditor } from '@platejs/ai/react'
import { usePlateEditor } from 'platejs/react'

import { EditorStatic } from '#rte/blocks/editor-static'
import { BaseEditorKit } from '#rte/kits/editor-base'

export const AIChatEditor = memo(({ content }: { content: string }) => {
  const aiEditor = usePlateEditor({
    plugins: BaseEditorKit,
  })

  useAIChatEditor(aiEditor, content)

  return <EditorStatic editor={aiEditor} variant="aiChat" />
})
