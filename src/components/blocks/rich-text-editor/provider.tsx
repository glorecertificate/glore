'use client'

import { useEffect, useId, useMemo, useRef } from 'react'

import { useTranslations } from 'next-intl'
import { type AnyPluginConfig, KEYS, type Value } from 'platejs'
import {
  BlockPlaceholderPlugin,
  type CreatePlateEditorOptions,
  Plate,
  type PlateProps,
  usePlateEditor,
} from 'platejs/react'

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
import { omit } from '@/lib/utils'

export const PLUGINS = {
  ai: AIKit,
  align: AlignKit,
  autoformat: AutoformatKit,
  basicBlocks: BasicBlocksKit,
  basicMarks: BasicMarksKit,
  blockMenu: BlockMenuKit,
  callout: CalloutKit,
  column: ColumnKit,
  cursorOverlay: CursorOverlayKit,
  date: DateKit,
  dnd: DndKit,
  docx: DocxKit,
  emoji: EmojiKit,
  exitBreak: ExitBreakKit,
  fixedToolbar: FixedToolbarKit,
  floatingToolbar: FloatingToolbarKit,
  font: FontKit,
  lineHeight: LineHeightKit,
  link: LinkKit,
  list: ListKit,
  markdown: MarkdownKit,
  media: MediaKit,
  slash: SlashKit,
  table: TableKit,
  toggle: ToggleKit,
  trailingBlock: TrailingBlockKit,
}

export type RichTextEditorPlugin = keyof typeof PLUGINS

export interface RichTextEditorProviderProps extends React.PropsWithChildren<
  Omit<CreatePlateEditorOptions, 'plugins'>
> {
  exclude?: RichTextEditorPlugin | RichTextEditorPlugin[]
  onChange?: PlateProps['onChange']
  version?: string
}

const EMPTY_EXCLUDE: RichTextEditorPlugin[] = []

export const RichTextEditorProvider = ({
  children,
  exclude = EMPTY_EXCLUDE,
  id,
  onChange,
  version,
  ...props
}: RichTextEditorProviderProps) => {
  const randomId = useId()
  const t = useTranslations('Components.RichTextEditor.placeholders')

  const plugins = useMemo(
    () =>
      [
        ...Object.values(omit(PLUGINS, exclude)),
        BlockPlaceholderPlugin.configure({
          options: {
            className:
              'before:absolute before:cursor-text before:text-muted-foreground/80 before:content-[attr(placeholder)]',
            placeholders: {
              [KEYS.p]: t('block'),
            },
            query: ({ path }: { path: number[] }) => path.length === 1,
          },
        }),
      ].flat() as AnyPluginConfig[],
    [exclude, t]
  )

  const editor = usePlateEditor(
    {
      id: id ?? randomId,
      plugins,
      ...props,
    },
    [plugins, id]
  )

  const prevVersionRef = useRef(version)

  useEffect(() => {
    if (version && version !== prevVersionRef.current && editor) {
      editor.children = (props.value || []) as Value
      editor.history.undos = []
      editor.history.redos = []
      editor.operations = []
      // @ts-expect-error
      editor.onChange()
      prevVersionRef.current = version
    }
  }, [editor, props.value, version])

  return (
    <Plate editor={editor} onChange={onChange}>
      {children}
    </Plate>
  )
}
