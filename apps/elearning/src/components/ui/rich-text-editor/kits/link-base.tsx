import { BaseLinkPlugin } from '@platejs/link'

import { LinkElementStatic } from '#rte/blocks/link-node-static'

export const BaseLinkKit = [BaseLinkPlugin.withComponent(LinkElementStatic)]
