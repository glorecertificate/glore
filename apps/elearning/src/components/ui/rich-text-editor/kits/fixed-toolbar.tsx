'use client'

import { createPlatePlugin } from 'platejs/react'

import { FixedToolbar } from '@rte/blocks/fixed-toolbar'
import { FixedToolbarButtons } from '@rte/blocks/fixed-toolbar-buttons'

export const FixedToolbarKit = [
  createPlatePlugin({
    key: 'fixed-toolbar',
    render: {
      beforeEditable: () => (
        <FixedToolbar className="cursor-default">
          <FixedToolbarButtons />
        </FixedToolbar>
      ),
    },
  }),
]
