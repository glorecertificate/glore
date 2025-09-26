import { AIKit } from './plugins/ai'
import { AlignKit } from './plugins/align'
import { AutoformatKit } from './plugins/autoformat'
import { BasicBlocksKit } from './plugins/basic-blocks'
import { BasicMarksKit } from './plugins/basic-marks'
import { BlockMenuKit } from './plugins/block-menu'
import { CalloutKit } from './plugins/callout'
import { ColumnKit } from './plugins/column'
import { CursorOverlayKit } from './plugins/cursor-overlay'
import { DateKit } from './plugins/date'
import { DndKit } from './plugins/dnd'
import { DocxKit } from './plugins/docx'
import { EmojiKit } from './plugins/emoji'
import { ExitBreakKit } from './plugins/exit-break'
import { FixedToolbarKit } from './plugins/fixed-toolbar'
import { FloatingToolbarKit } from './plugins/floating-toolbar'
import { FontKit } from './plugins/font'
import { LineHeightKit } from './plugins/line-height'
import { LinkKit } from './plugins/link'
import { ListKit } from './plugins/list'
import { MarkdownKit } from './plugins/markdown'
import { MediaKit } from './plugins/media'
import { SlashKit } from './plugins/slash'
import { TableKit } from './plugins/table'
import { ToggleKit } from './plugins/toggle'
import { TrailingBlockKit } from './plugins/trailing-block'

export const LOCALES = ['en', 'es', 'it'] as const
export const DEFAULT_LOCALE: (typeof LOCALES)[number] = 'en'

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

export const ACTION_THREE_COLUMNS = 'action_three_columns'

export const API_ENDPOINTS = {
  aiChat: '/api/ai/chat',
  aiCommand: '/api/ai/command',
  aiCopilot: '/api/ai/copilot',
  docxExport: '/api/docx/export',
}
