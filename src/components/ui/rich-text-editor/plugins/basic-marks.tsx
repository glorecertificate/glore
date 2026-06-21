import { BoldPlugin, ItalicPlugin, StrikethroughPlugin, UnderlinePlugin } from '@platejs/basic-nodes/react'

export const BasicMarksKit = [
  BoldPlugin,
  ItalicPlugin,
  UnderlinePlugin,
  StrikethroughPlugin.configure({
    shortcuts: { toggle: { keys: 'mod+shift+x' } },
  }),
]
