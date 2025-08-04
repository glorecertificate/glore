'use client'

import { KEYS } from 'platejs'
import { BlockPlaceholderPlugin } from 'platejs/react'

import { useTranslations } from '@/hooks/use-translations'

export const useBlockPlaceholderKit = () => {
  const t = useTranslations('Editor.placeholders')

  return [
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
}
