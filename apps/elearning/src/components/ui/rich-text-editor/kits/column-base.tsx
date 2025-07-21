import { BaseColumnItemPlugin, BaseColumnPlugin } from '@platejs/layout'

import { ColumnElementStatic, ColumnGroupElementStatic } from '#rte/blocks/column-node-static'

export const BaseColumnKit = [
  BaseColumnPlugin.withComponent(ColumnGroupElementStatic),
  BaseColumnItemPlugin.withComponent(ColumnElementStatic),
]
