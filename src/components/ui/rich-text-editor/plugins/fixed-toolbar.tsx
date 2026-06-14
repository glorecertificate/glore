'use client'

import { createPlatePlugin } from 'platejs/react'

import { FixedToolbar } from '@/components/ui/rich-text-editor/components/fixed-toolbar'
import { FixedToolbarButtons } from '@/components/ui/rich-text-editor/components/fixed-toolbar-buttons'

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
