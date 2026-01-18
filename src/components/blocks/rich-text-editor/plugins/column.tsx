import { ColumnItemPlugin, ColumnPlugin } from '@platejs/layout/react'

import { ColumnElement, ColumnGroupElement } from '@/components/blocks/rich-text-editor/ui/column-node'

export const ColumnKit = [ColumnPlugin.withComponent(ColumnGroupElement), ColumnItemPlugin.withComponent(ColumnElement)]
