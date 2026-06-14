'use client'

import { createPlatePlugin } from 'platejs/react'

import { FloatingToolbar } from '@/components/ui/rich-text-editor/components/floating-toolbar'
import { FloatingToolbarButtons } from '@/components/ui/rich-text-editor/components/floating-toolbar-buttons'

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
