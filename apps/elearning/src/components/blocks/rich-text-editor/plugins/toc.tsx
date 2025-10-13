import { TocPlugin } from '@platejs/toc/react'

import { TocElement } from '../components/toc-node'

export const TocKit = [
  TocPlugin.configure({
    options: {
      topOffset: 80,
    },
  }).withComponent(TocElement),
]
