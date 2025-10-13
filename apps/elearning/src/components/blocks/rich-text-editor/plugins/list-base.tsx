import { BaseListPlugin } from '@platejs/list'
import { KEYS } from 'platejs'

import { BaseIndentKit } from '@/components/blocks/rich-text-editor/plugins/indent-base'
import { BlockListStatic } from '@/components/blocks/rich-text-editor/ui/block-list-static'

export const BaseListKit = [
  ...BaseIndentKit,
  BaseListPlugin.configure({
    inject: {
      targetPlugins: [...KEYS.heading, KEYS.p, KEYS.blockquote, KEYS.codeBlock, KEYS.toggle],
    },
    render: {
      belowNodes: BlockListStatic,
    },
  }),
]
