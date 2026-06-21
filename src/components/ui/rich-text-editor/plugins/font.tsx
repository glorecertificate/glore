import { FontColorPlugin } from '@platejs/basic-styles/react'
import { KEYS } from 'platejs'

export const FontKit = [
  FontColorPlugin.configure({
    inject: {
      nodeProps: {
        defaultNodeValue: 'black',
      },
      targetPlugins: [KEYS.p],
    },
  }),
]
