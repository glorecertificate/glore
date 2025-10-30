import { MarkdownPlugin, remarkMdx, remarkMention } from '@platejs/markdown'
import { KEYS } from 'platejs'
import remarkGfm from 'remark-gfm'

export const MarkdownKit = [
  MarkdownPlugin.configure({
    options: {
      disallowedNodes: [KEYS.suggestion],
      remarkPlugins: [remarkGfm, remarkMdx, remarkMention],
    },
  }),
]
