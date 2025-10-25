import { CursorOverlayPlugin } from '@platejs/selection/react'

import { CursorOverlay } from '@/components/blocks/rich-text-editor/ui/cursor-overlay'

export const CursorOverlayKit = [
  CursorOverlayPlugin.configure({
    render: {
      afterEditable: () => CursorOverlay(),
    },
  }),
]
