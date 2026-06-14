import { BaseTocPlugin } from '@platejs/toc'

import { TocElementStatic } from '@/components/ui/rich-text-editor/components/toc-node-static'

export const BaseTocKit = [BaseTocPlugin.withComponent(TocElementStatic)]
