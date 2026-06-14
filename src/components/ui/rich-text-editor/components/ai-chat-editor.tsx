'use client'

import { useId } from 'react'

import { useAIChatEditor } from '@platejs/ai/react'
import { usePlateEditor } from 'platejs/react'

import { StaticEditor } from '@/components/ui/rich-text-editor/components/static-editor'
import { BaseEditorKit } from '@/components/ui/rich-text-editor/plugins/editor-base'

export const AIChatEditor = ({ content }: { content: string }) => {
  const id = useId()

  const aiEditor = usePlateEditor(
    {
      id,
      plugins: BaseEditorKit,
    },
    [BaseEditorKit]
  )

  useAIChatEditor(aiEditor, content)

  return <StaticEditor editor={aiEditor} variant="aiChat" />
}
