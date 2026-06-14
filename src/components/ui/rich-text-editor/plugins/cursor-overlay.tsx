import { CursorOverlayPlugin } from '@platejs/selection/react'

import { CursorOverlay } from '@/components/ui/rich-text-editor/components/cursor-overlay'

export const CursorOverlayKit = [
  CursorOverlayPlugin.configure({
    render: {
      afterEditable: () => CursorOverlay(),
    },
  }),
]
