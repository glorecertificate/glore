import { BlockMenuPlugin } from '@platejs/selection/react'

import { BlockContextMenu } from '../components/block-context-menu'
import { BlockSelectionKit } from './block-selection'

export const BlockMenuKit = [
  ...BlockSelectionKit,
  BlockMenuPlugin.configure({
    render: { aboveEditable: BlockContextMenu },
  }),
]
