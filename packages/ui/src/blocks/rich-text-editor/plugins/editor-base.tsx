import { BaseAlignKit } from './align-base'
import { BaseBasicBlocksKit } from './basic-blocks-base'
import { BaseBasicMarksKit } from './basic-marks-base'
import { BaseCalloutKit } from './callout-base'
import { BaseCodeBlockKit } from './code-block-base'
import { BaseColumnKit } from './column-base'
import { BaseCommentKit } from './comment-base'
import { BaseDateKit } from './date-base'
import { BaseFontKit } from './font-base'
import { BaseLineHeightKit } from './line-height-base'
import { BaseLinkKit } from './link-base'
import { BaseListKit } from './list-base'
import { MarkdownKit } from './markdown'
import { BaseMathKit } from './math-base'
import { BaseMediaKit } from './media-base'
import { BaseMentionKit } from './mention-base'
import { BaseSuggestionKit } from './suggestion-base'
import { BaseTableKit } from './table-base'
import { BaseTocKit } from './toc-base'
import { BaseToggleKit } from './toggle-base'

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
