'use client'

import { KEYS } from 'platejs'
import { BlockPlaceholderPlugin } from 'platejs/react'

import { type Translator } from '@/lib/i18n/types'

export const blockPlaceholderKit = (t: Translator<'Editor.placeholders'>) => [
  BlockPlaceholderPlugin.configure({
    options: {
      className:
        'before:absolute before:cursor-text before:text-muted-foreground/80 before:content-[attr(placeholder)]',
      placeholders: {
        [KEYS.p]: t('block'),
      },
      query: ({ path }) => path.length === 1,
    },
  }),
]
