import { KEYS } from 'platejs'
import { BlockPlaceholderPlugin } from 'platejs/react'

import { useI18n } from '../hooks/use-i18n'

export const useBlockPlaceholderKit = () => {
  const { t } = useI18n()

  return [
    BlockPlaceholderPlugin.configure({
      options: {
        className:
          'before:absolute before:cursor-text before:text-muted-foreground/80 before:content-[attr(placeholder)]',
        placeholders: {
          [KEYS.p]: t.placeholders.block,
        },
        query: ({ path }) => path.length === 1,
      },
    }),
  ]
}
