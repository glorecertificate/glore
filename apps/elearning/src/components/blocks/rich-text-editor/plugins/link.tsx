import { LinkPlugin } from '@platejs/link/react'

import { LinkElement } from '@/components/blocks/rich-text-editor/ui/link-node'
import { LinkFloatingToolbar } from '@/components/blocks/rich-text-editor/ui/link-toolbar'

export const LinkKit = [
  LinkPlugin.configure({
    render: {
      node: LinkElement,
      afterEditable: () => <LinkFloatingToolbar />,
    },
  }),
]
