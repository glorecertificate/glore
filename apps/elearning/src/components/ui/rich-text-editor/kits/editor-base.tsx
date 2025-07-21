import { BaseAlignKit } from '#rte/kits/align-base'
import { BaseBasicBlocksKit } from '#rte/kits/basic-blocks-base'
import { BaseBasicMarksKit } from '#rte/kits/basic-marks-base'
import { BaseCalloutKit } from '#rte/kits/callout-base'
import { BaseCodeBlockKit } from '#rte/kits/code-block-base'
import { BaseColumnKit } from '#rte/kits/column-base'
import { BaseCommentKit } from '#rte/kits/comment-base'
import { BaseDateKit } from '#rte/kits/date-base'
import { BaseFontKit } from '#rte/kits/font-base'
import { BaseLineHeightKit } from '#rte/kits/line-height-base'
import { BaseLinkKit } from '#rte/kits/link-base'
import { BaseListKit } from '#rte/kits/list-base'
import { MarkdownKit } from '#rte/kits/markdown'
import { BaseMathKit } from '#rte/kits/math-base'
import { BaseMediaKit } from '#rte/kits/media-base'
import { BaseMentionKit } from '#rte/kits/mention-base'
import { BaseSuggestionKit } from '#rte/kits/suggestion-base'
import { BaseTableKit } from '#rte/kits/table-base'
import { BaseTocKit } from '#rte/kits/toc-base'
import { BaseToggleKit } from '#rte/kits/toggle-base'

export const BaseEditorKit = [
  ...BaseBasicBlocksKit,
  ...BaseCodeBlockKit,
  ...BaseTableKit,
  ...BaseToggleKit,
  ...BaseTocKit,
  ...BaseMediaKit,
  ...BaseCalloutKit,
  ...BaseColumnKit,
  ...BaseMathKit,
  ...BaseDateKit,
  ...BaseLinkKit,
  ...BaseMentionKit,
  ...BaseBasicMarksKit,
  ...BaseFontKit,
  ...BaseListKit,
  ...BaseAlignKit,
  ...BaseLineHeightKit,
  ...BaseCommentKit,
  ...BaseSuggestionKit,
  ...MarkdownKit,
]
