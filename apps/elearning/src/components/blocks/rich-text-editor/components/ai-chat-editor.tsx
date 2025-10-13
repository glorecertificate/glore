'use client'

import { memo } from 'react'

import { useAIChatEditor } from '@platejs/ai/react'
import { usePlateEditor } from 'platejs/react'

import { BaseEditorKit } from '../plugins/editor-base'
import { EditorStatic } from './editor-static'

export const AIChatEditor = memo(({ content }: { content: string }) => {
  const aiEditor = usePlateEditor({
    plugins: BaseEditorKit,
  })

  useAIChatEditor(aiEditor, content)

  return <EditorStatic editor={aiEditor} variant="aiChat" />
})
