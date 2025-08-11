'use client'

import { LinkPlugin } from '@platejs/link/react'

import { LinkElement } from '@rte/blocks/link-node'
import { LinkFloatingToolbar } from '@rte/blocks/link-toolbar'

export const LinkKit = [
  LinkPlugin.configure({
    render: {
      node: LinkElement,
      afterEditable: () => <LinkFloatingToolbar />,
    },
  }),
]
