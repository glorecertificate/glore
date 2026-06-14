import { BaseAlignKit } from '@/components/ui/rich-text-editor/plugins/align-base'
import { BaseBasicBlocksKit } from '@/components/ui/rich-text-editor/plugins/basic-blocks-base'
import { BaseBasicMarksKit } from '@/components/ui/rich-text-editor/plugins/basic-marks-base'
import { BaseCalloutKit } from '@/components/ui/rich-text-editor/plugins/callout-base'
import { BaseColumnKit } from '@/components/ui/rich-text-editor/plugins/column-base'
import { BaseDateKit } from '@/components/ui/rich-text-editor/plugins/date-base'
import { BaseFontKit } from '@/components/ui/rich-text-editor/plugins/font-base'
import { BaseLineHeightKit } from '@/components/ui/rich-text-editor/plugins/line-height-base'
import { BaseLinkKit } from '@/components/ui/rich-text-editor/plugins/link-base'
import { BaseListKit } from '@/components/ui/rich-text-editor/plugins/list-base'
import { MarkdownKit } from '@/components/ui/rich-text-editor/plugins/markdown'
import { BaseMediaKit } from '@/components/ui/rich-text-editor/plugins/media-base'
import { BaseTableKit } from '@/components/ui/rich-text-editor/plugins/table-base'
import { BaseTocKit } from '@/components/ui/rich-text-editor/plugins/toc-base'
import { BaseToggleKit } from '@/components/ui/rich-text-editor/plugins/toggle-base'

export const BaseEditorKit = [
  ...BaseBasicBlocksKit,
  ...BaseTableKit,
  ...BaseToggleKit,
  ...BaseTocKit,
  ...BaseMediaKit,
  ...BaseCalloutKit,
  ...BaseColumnKit,
  ...BaseDateKit,
  ...BaseLinkKit,
  ...BaseBasicMarksKit,
  ...BaseFontKit,
  ...BaseListKit,
  ...BaseAlignKit,
  ...BaseLineHeightKit,
  ...MarkdownKit,
]
