import { BaseCalloutPlugin } from '@platejs/callout'

import { CalloutElementStatic } from '@/components/blocks/rich-text-editor/ui/callout-node-static'

export const BaseCalloutKit = [BaseCalloutPlugin.withComponent(CalloutElementStatic)]
