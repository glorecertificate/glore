import { BasicBlocksKit } from '@/components/blocks/rich-text-editor/plugins/basic-blocks'
import { BasicMarksKit } from '@/components/blocks/rich-text-editor/plugins/basic-marks'

export const BasicNodesKit = [...BasicBlocksKit, ...BasicMarksKit]
