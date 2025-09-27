'use client'

import { useEditorRef, usePlateState } from 'platejs/react'
import { useEffect, useMemo } from 'react'

import { Editor, EditorContainer, type EditorProps } from './components/editor'
import { EditorProvider, type EditorProviderProps } from './components/editor-provider'
import { I18nProvider, type I18nProviderProps } from './components/i18n-provider'
import { useI18n } from './hooks/use-i18n'

export interface RichTextEditorProviderProps extends Omit<I18nProviderProps, 'children'>, EditorProviderProps {}

export const RichTextEditorProvider = ({ locale, ...props }: RichTextEditorProviderProps) => (
  <I18nProvider locale={locale}>
    <EditorProvider {...props} />
  </I18nProvider>
)

export const RichTextEditor = ({ autoFocus, ...props }: EditorProps) => {
  const { t } = useI18n('placeholders')
  const editor = useEditorRef()
  const [readOnly] = usePlateState('readOnly')

  const placeholder = useMemo(() => (readOnly ? t.editorReadonly : t.editor), [readOnly, t])

  useEffect(() => {
    if (!autoFocus || editor.dom.focused) return
    editor.tf.focus({ edge: 'end' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <EditorContainer>
      <Editor autoFocus={autoFocus} placeholder={placeholder} {...props} />
    </EditorContainer>
  )
}

export * from './hooks/use-chat'
export * from './hooks/use-editor'
export type * from './types'
