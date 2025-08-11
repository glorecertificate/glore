import { BaseCalloutPlugin } from '@platejs/callout'

import { CalloutElementStatic } from '@rte/blocks/callout-node-static'

export const BaseCalloutKit = [BaseCalloutPlugin.withComponent(CalloutElementStatic)]
