'use client'

import { useEffect, useMemo } from 'react'

import { Plate, useEditorRef, usePlateEditor, usePlateState } from 'platejs/react'

import { useTranslations } from '@/hooks/use-translations'
import { Editor, EditorContainer, type EditorProps } from '@rte/blocks/editor'
import { AIKit } from '@rte/kits/ai'
import { AlignKit } from '@rte/kits/align'
import { AutoformatKit } from '@rte/kits/autoformat'
import { BasicBlocksKit } from '@rte/kits/basic-blocks'
import { BasicMarksKit } from '@rte/kits/basic-marks'
import { BlockMenuKit } from '@rte/kits/block-menu'
import { useBlockPlaceholderKit } from '@rte/kits/block-placeholder'
import { CalloutKit } from '@rte/kits/callout'
import { ColumnKit } from '@rte/kits/column'
import { CursorOverlayKit } from '@rte/kits/cursor-overlay'
import { DateKit } from '@rte/kits/date'
import { DndKit } from '@rte/kits/dnd'
import { DocxKit } from '@rte/kits/docx'
import { EmojiKit } from '@rte/kits/emoji'
import { ExitBreakKit } from '@rte/kits/exit-break'
import { FixedToolbarKit } from '@rte/kits/fixed-toolbar'
import { FloatingToolbarKit } from '@rte/kits/floating-toolbar'
import { FontKit } from '@rte/kits/font'
import { LineHeightKit } from '@rte/kits/line-height'
import { LinkKit } from '@rte/kits/link'
import { ListKit } from '@rte/kits/list'
import { MarkdownKit } from '@rte/kits/markdown'
import { MediaKit } from '@rte/kits/media'
import { SlashKit } from '@rte/kits/slash'
import { TableKit } from '@rte/kits/table'
import { ToggleKit } from '@rte/kits/toggle'
import { TrailingBlockKit } from '@rte/kits/trailing-block'

export const PLUGINS = [
  ...AIKit,
  ...AlignKit,
  ...AutoformatKit,
  ...BasicBlocksKit,
  ...BasicMarksKit,
  ...BlockMenuKit,
  ...CalloutKit,
  ...ColumnKit,
  ...CursorOverlayKit,
  ...DateKit,
  ...DndKit,
  ...DocxKit,
  ...EmojiKit,
  ...ExitBreakKit,
  ...FixedToolbarKit,
  ...FloatingToolbarKit,
  ...FontKit,
  ...LineHeightKit,
  ...LinkKit,
  ...ListKit,
  ...MarkdownKit,
  ...MediaKit,
  ...SlashKit,
  ...TableKit,
  ...ToggleKit,
  ...TrailingBlockKit,
]

export interface RichTextEditorProviderProps extends React.PropsWithChildren<Pick<RichTextEditorProps, 'value'>> {}

export const RichTextEditorProvider = ({ children, value }: RichTextEditorProviderProps) => {
  const BlockPlaceholderKit = useBlockPlaceholderKit()
  const plugins = useMemo(() => [...PLUGINS, ...BlockPlaceholderKit], [BlockPlaceholderKit])
  const editor = usePlateEditor({ plugins, value: value as string })

  return <Plate editor={editor}>{children}</Plate>
}

export interface RichTextEditorProps extends EditorProps {}

export const RichTextEditor = ({ autoFocus, ...props }: RichTextEditorProps) => {
  const editor = useEditorRef()
  const [readOnly] = usePlateState('readOnly')
  const t = useTranslations('Editor.placeholders')

  const placeholder = useMemo(() => (readOnly ? t('editorReadonly') : t('editor')), [readOnly, t])

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
