'use client'

import { TocPlugin } from '@platejs/toc/react'

import { TocElement } from '@rte/blocks/toc-node'

export const TocKit = [
  TocPlugin.configure({
    options: {
      topOffset: 80,
    },
  }).withComponent(TocElement),
]
