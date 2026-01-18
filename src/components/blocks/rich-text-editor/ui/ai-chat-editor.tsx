'use client'

import { memo, useId } from 'react'

import { useAIChatEditor } from '@platejs/ai/react'
import { usePlateEditor } from 'platejs/react'

import { BaseEditorKit } from '@/components/blocks/rich-text-editor/plugins/editor-base'
import { StaticEditor } from '@/components/blocks/rich-text-editor/ui/static-editor'

export const AIChatEditor = memo(({ content }: { content: string }) => {
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
})
