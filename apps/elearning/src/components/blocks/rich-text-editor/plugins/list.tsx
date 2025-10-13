import { ListPlugin } from '@platejs/list/react'
import { KEYS } from 'platejs'

import { IndentKit } from '@/components/blocks/rich-text-editor/plugins/indent'
import { BlockList } from '@/components/blocks/rich-text-editor/ui/block-list'

export const ListKit = [
  ...IndentKit,
  ListPlugin.configure({
    inject: {
      targetPlugins: [...KEYS.heading, KEYS.p, KEYS.blockquote, KEYS.codeBlock, KEYS.toggle],
    },
    render: {
      belowNodes: BlockList,
    },
  }),
]
