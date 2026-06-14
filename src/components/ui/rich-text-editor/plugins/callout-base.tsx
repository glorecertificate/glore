import { BaseCalloutPlugin } from '@platejs/callout'

import { CalloutElementStatic } from '@/components/ui/rich-text-editor/components/callout-node-static'

export const BaseCalloutKit = [BaseCalloutPlugin.withComponent(CalloutElementStatic)]
