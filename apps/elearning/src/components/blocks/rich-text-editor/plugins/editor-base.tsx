import { BaseAlignKit } from '@/components/blocks/rich-text-editor/plugins/align-base'
import { BaseBasicBlocksKit } from '@/components/blocks/rich-text-editor/plugins/basic-blocks-base'
import { BaseBasicMarksKit } from '@/components/blocks/rich-text-editor/plugins/basic-marks-base'
import { BaseCalloutKit } from '@/components/blocks/rich-text-editor/plugins/callout-base'
import { BaseCodeBlockKit } from '@/components/blocks/rich-text-editor/plugins/code-block-base'
import { BaseColumnKit } from '@/components/blocks/rich-text-editor/plugins/column-base'
import { BaseDateKit } from '@/components/blocks/rich-text-editor/plugins/date-base'
import { BaseFontKit } from '@/components/blocks/rich-text-editor/plugins/font-base'
import { BaseLineHeightKit } from '@/components/blocks/rich-text-editor/plugins/line-height-base'
import { BaseLinkKit } from '@/components/blocks/rich-text-editor/plugins/link-base'
import { BaseListKit } from '@/components/blocks/rich-text-editor/plugins/list-base'
import { MarkdownKit } from '@/components/blocks/rich-text-editor/plugins/markdown'
import { BaseMediaKit } from '@/components/blocks/rich-text-editor/plugins/media-base'
import { BaseTableKit } from '@/components/blocks/rich-text-editor/plugins/table-base'
import { BaseTocKit } from '@/components/blocks/rich-text-editor/plugins/toc-base'
import { BaseToggleKit } from '@/components/blocks/rich-text-editor/plugins/toggle-base'

export const BaseEditorKit = [
  ...BaseBasicBlocksKit,
  ...BaseCodeBlockKit,
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
