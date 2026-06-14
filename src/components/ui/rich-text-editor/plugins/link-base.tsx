import { BaseLinkPlugin } from '@platejs/link'

import { LinkElementStatic } from '@/components/ui/rich-text-editor/components/link-node-static'

export const BaseLinkKit = [BaseLinkPlugin.withComponent(LinkElementStatic)]
