import emojiMartData, { type EmojiMartData } from '@emoji-mart/data'
import { EmojiInputPlugin, EmojiPlugin } from '@platejs/emoji/react'

import { EmojiInputElement } from '@/components/ui/rich-text-editor/components/emoji-node'

export const EmojiKit = [
  EmojiPlugin.configure({
    options: { data: emojiMartData as EmojiMartData },
  }),
  EmojiInputPlugin.withComponent(EmojiInputElement),
]
