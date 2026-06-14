import { LinkPlugin } from '@platejs/link/react'

import { LinkElement } from '@/components/ui/rich-text-editor/components/link-node'
import { LinkFloatingToolbar } from '@/components/ui/rich-text-editor/components/link-toolbar'

export const LinkKit = [
  LinkPlugin.configure({
    render: {
      afterEditable: () => <LinkFloatingToolbar />,
      node: LinkElement,
    },
  }),
]
