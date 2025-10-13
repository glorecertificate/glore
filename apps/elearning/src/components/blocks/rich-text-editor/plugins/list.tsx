import { ListPlugin } from '@platejs/list/react'
import { KEYS } from 'platejs'

import { BlockList } from '../components/block-list'
import { IndentKit } from './indent'

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
