'use client'

import { useMemo } from 'react'

import { Plate, usePlateEditor } from 'platejs/react'

import { useTranslations } from '@/hooks/use-translations'
import { Editor, EditorContainer, type EditorProps } from '#rte/blocks/editor'
import { SettingsDialog } from '#rte/blocks/settings-dialog'
import { AIKit } from '#rte/kits/ai'
import { AlignKit } from '#rte/kits/align'
import { AutoformatKit } from '#rte/kits/autoformat'
import { BasicBlocksKit } from '#rte/kits/basic-blocks'
import { BasicMarksKit } from '#rte/kits/basic-marks'
import { BlockMenuKit } from '#rte/kits/block-menu'
import { blockPlaceholderKit } from '#rte/kits/block-placeholder'
import { CalloutKit } from '#rte/kits/callout'
import { ColumnKit } from '#rte/kits/column'
import { CopilotKit } from '#rte/kits/copilot'
import { CursorOverlayKit } from '#rte/kits/cursor-overlay'
import { DateKit } from '#rte/kits/date'
import { DndKit } from '#rte/kits/dnd'
import { DocxKit } from '#rte/kits/docx'
import { EmojiKit } from '#rte/kits/emoji'
import { ExitBreakKit } from '#rte/kits/exit-break'
import { FixedToolbarKit } from '#rte/kits/fixed-toolbar'
import { FloatingToolbarKit } from '#rte/kits/floating-toolbar'
import { FontKit } from '#rte/kits/font'
import { LineHeightKit } from '#rte/kits/line-height'
import { LinkKit } from '#rte/kits/link'
import { ListKit } from '#rte/kits/list'
import { MarkdownKit } from '#rte/kits/markdown'
import { MediaKit } from '#rte/kits/media'
import { SlashKit } from '#rte/kits/slash'
import { TableKit } from '#rte/kits/table'
import { ToggleKit } from '#rte/kits/toggle'
import { TrailingBlockKit } from '#rte/kits/trailing-block'

export const PLUGINS = [
  ...CopilotKit,
  ...AIKit,
  ...BasicBlocksKit,
  ...TableKit,
  ...ToggleKit,
  ...MediaKit,
  ...CalloutKit,
  ...ColumnKit,
  ...DateKit,
  ...LinkKit,
  ...BasicMarksKit,
  ...FontKit,
  ...ListKit,
  ...AlignKit,
  ...LineHeightKit,
  ...SlashKit,
  ...AutoformatKit,
  ...CursorOverlayKit,
  ...BlockMenuKit,
  ...DndKit,
  ...EmojiKit,
  ...ExitBreakKit,
  ...DocxKit,
  ...MarkdownKit,
  ...FixedToolbarKit,
  ...FloatingToolbarKit,
  ...TrailingBlockKit,
]

export interface RichTextEditorProps extends EditorProps {}

export const RichTextEditor = ({ value, ...props }: RichTextEditorProps) => {
  const t = useTranslations('Editor.placeholders')
  const plugins = useMemo(() => [...PLUGINS, ...blockPlaceholderKit(t)], [t])
  const editor = usePlateEditor({ plugins, value: value as string })

  return (
    <Plate editor={editor}>
      <EditorContainer>
        <Editor placeholder={t('editor')} {...props} />
      </EditorContainer>
      <SettingsDialog />
    </Plate>
  )
}
