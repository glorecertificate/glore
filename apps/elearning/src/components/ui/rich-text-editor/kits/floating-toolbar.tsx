'use client'

import { createPlatePlugin } from 'platejs/react'

import { FloatingToolbar } from '@rte/blocks/floating-toolbar'
import { FloatingToolbarButtons } from '@rte/blocks/floating-toolbar-buttons'

export const FloatingToolbarKit = [
  createPlatePlugin({
    key: 'floating-toolbar',
    render: {
      afterEditable: () => (
        <FloatingToolbar>
          <FloatingToolbarButtons />
        </FloatingToolbar>
      ),
    },
  }),
]
