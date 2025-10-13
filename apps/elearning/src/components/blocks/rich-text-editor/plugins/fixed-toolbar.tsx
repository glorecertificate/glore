import { createPlatePlugin } from 'platejs/react'

import { FixedToolbar } from '@/components/blocks/rich-text-editor/ui/fixed-toolbar'
import { FixedToolbarButtons } from '@/components/blocks/rich-text-editor/ui/fixed-toolbar-buttons'

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
