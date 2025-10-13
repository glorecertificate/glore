'use client'

import { useId, useMemo } from 'react'

import { useTranslations } from 'next-intl'
import { KEYS } from 'platejs'
import { BlockPlaceholderPlugin, type CreatePlateEditorOptions, Plate, usePlateEditor } from 'platejs/react'

import { AIKit } from '@/components/blocks/rich-text-editor/plugins/ai'
import { AlignKit } from '@/components/blocks/rich-text-editor/plugins/align'
import { AutoformatKit } from '@/components/blocks/rich-text-editor/plugins/autoformat'
import { BasicBlocksKit } from '@/components/blocks/rich-text-editor/plugins/basic-blocks'
import { BasicMarksKit } from '@/components/blocks/rich-text-editor/plugins/basic-marks'
import { BlockMenuKit } from '@/components/blocks/rich-text-editor/plugins/block-menu'
import { CalloutKit } from '@/components/blocks/rich-text-editor/plugins/callout'
import { ColumnKit } from '@/components/blocks/rich-text-editor/plugins/column'
import { CursorOverlayKit } from '@/components/blocks/rich-text-editor/plugins/cursor-overlay'
import { DateKit } from '@/components/blocks/rich-text-editor/plugins/date'
import { DndKit } from '@/components/blocks/rich-text-editor/plugins/dnd'
import { DocxKit } from '@/components/blocks/rich-text-editor/plugins/docx'
import { EmojiKit } from '@/components/blocks/rich-text-editor/plugins/emoji'
import { ExitBreakKit } from '@/components/blocks/rich-text-editor/plugins/exit-break'
import { FixedToolbarKit } from '@/components/blocks/rich-text-editor/plugins/fixed-toolbar'
import { FloatingToolbarKit } from '@/components/blocks/rich-text-editor/plugins/floating-toolbar'
import { FontKit } from '@/components/blocks/rich-text-editor/plugins/font'
import { LineHeightKit } from '@/components/blocks/rich-text-editor/plugins/line-height'
import { LinkKit } from '@/components/blocks/rich-text-editor/plugins/link'
import { ListKit } from '@/components/blocks/rich-text-editor/plugins/list'
import { MarkdownKit } from '@/components/blocks/rich-text-editor/plugins/markdown'
import { MediaKit } from '@/components/blocks/rich-text-editor/plugins/media'
import { SlashKit } from '@/components/blocks/rich-text-editor/plugins/slash'
import { TableKit } from '@/components/blocks/rich-text-editor/plugins/table'
import { ToggleKit } from '@/components/blocks/rich-text-editor/plugins/toggle'
import { TrailingBlockKit } from '@/components/blocks/rich-text-editor/plugins/trailing-block'

const PLUGINS = [
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

export type RichTextEditorProviderProps = React.PropsWithChildren<Omit<CreatePlateEditorOptions, 'plugins'>>

export const RichTextEditorProvider = ({ children, id, ...props }: RichTextEditorProviderProps) => {
  const randomId = useId()
  const editorId = useMemo(() => id ?? randomId, [id, randomId])
  const t = useTranslations('Editor.placeholders')
  const blockPlaceholder = t('block')

  const plugins = useMemo(
    () => [
      ...PLUGINS,
      BlockPlaceholderPlugin.configure({
        options: {
          className:
            'before:absolute before:cursor-text before:text-muted-foreground/80 before:content-[attr(placeholder)]',
          placeholders: {
            [KEYS.p]: blockPlaceholder,
          },
          query: ({ path }) => path.length === 1,
        },
      }),
    ],
    [blockPlaceholder]
  )

  const editor = usePlateEditor(
    {
      id: editorId,
      plugins,
      ...props,
    },
    [plugins, id]
  )

  return <Plate editor={editor}>{children}</Plate>
}
