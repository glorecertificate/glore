import { BlockMenuPlugin } from '@platejs/selection/react'

import { BlockSelectionKit } from '@/components/blocks/rich-text-editor/plugins/block-selection'
import { BlockContextMenu } from '@/components/blocks/rich-text-editor/ui/block-context-menu'

export const BlockMenuKit = [
  ...BlockSelectionKit,
  BlockMenuPlugin.configure({
    render: { aboveEditable: BlockContextMenu },
  }),
]
