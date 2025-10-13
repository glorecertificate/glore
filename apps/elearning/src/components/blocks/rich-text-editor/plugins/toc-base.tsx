import { BaseTocPlugin } from '@platejs/toc'

import { TocElementStatic } from '@/components/blocks/rich-text-editor/ui/toc-node-static'

export const BaseTocKit = [BaseTocPlugin.withComponent(TocElementStatic)]
