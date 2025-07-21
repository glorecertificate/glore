'use client'

import { BlockMenuPlugin } from '@platejs/selection/react'

import { BlockContextMenu } from '#rte/blocks/block-context-menu'
import { BlockSelectionKit } from '#rte/kits/block-selection'

export const BlockMenuKit = [
  ...BlockSelectionKit,
  BlockMenuPlugin.configure({
    render: { aboveEditable: BlockContextMenu },
  }),
]
