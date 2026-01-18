'use client'

import { useMemo } from 'react'

import { useTranslations } from 'next-intl'

import { Editor, EditorContainer, type EditorProps } from '@/components/blocks/rich-text-editor/ui/editor'

export const RichTextEditor = ({ readOnly, ...props }: EditorProps) => {
  const t = useTranslations('Components.RichTextEditor.placeholders')
  const placeholder = useMemo(() => (readOnly ? t('editorReadonly') : t('editor')), [t, readOnly])

  return (
    <EditorContainer>
      <Editor placeholder={placeholder} readOnly={readOnly} {...props} />
    </EditorContainer>
  )
}
