import { BlockMenuPlugin } from '@platejs/selection/react'

import { BlockContextMenu } from '@/components/ui/rich-text-editor/components/block-context-menu'
import { BlockSelectionKit } from '@/components/ui/rich-text-editor/plugins/block-selection'

export const BlockMenuKit = [
  ...BlockSelectionKit,
  BlockMenuPlugin.configure({
    render: { aboveEditable: BlockContextMenu },
  }),
]
