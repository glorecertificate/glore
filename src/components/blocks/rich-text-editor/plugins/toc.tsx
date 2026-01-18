import { TocPlugin } from '@platejs/toc/react'

import { TocElement } from '@/components/blocks/rich-text-editor/ui/toc-node'

export const TocKit = [
  TocPlugin.configure({
    options: {
      topOffset: 80,
    },
  }).withComponent(TocElement),
]
