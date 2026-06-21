import { EmojiInputPlugin, EmojiPlugin } from '@platejs/emoji/react'

import { EmojiInputElement } from '@/components/ui/rich-text-editor/components/emoji-node'

export const EmojiKit = [EmojiPlugin, EmojiInputPlugin.withComponent(EmojiInputElement)]
