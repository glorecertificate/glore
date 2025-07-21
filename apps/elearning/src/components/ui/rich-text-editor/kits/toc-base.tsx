import { BaseTocPlugin } from '@platejs/toc'

import { TocElementStatic } from '#rte/blocks/toc-node-static'

export const BaseTocKit = [BaseTocPlugin.withComponent(TocElementStatic)]
