'use client'

import { useMemo } from 'react'

import { useTranslations } from 'next-intl'
import { usePlateEditor, usePlateState } from 'platejs/react'

import { Editor, EditorContainer, type EditorProps } from '@/components/blocks/rich-text-editor/ui/editor'

export const useEditor = usePlateEditor
export const useEditorState = usePlateState

export type RichTextEditorProps = EditorProps

export const RichTextEditor = ({ readOnly, ...props }: RichTextEditorProps) => {
  const t = useTranslations('Editor.placeholders')
  const placeholder = useMemo(() => (readOnly ? t('editorReadonly') : t('editor')), [t, readOnly])

  return (
    <EditorContainer>
      <Editor placeholder={placeholder} readOnly={readOnly} {...props} />
    </EditorContainer>
  )
}
