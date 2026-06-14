import { TableCellHeaderPlugin, TableCellPlugin, TablePlugin, TableRowPlugin } from '@platejs/table/react'

import {
  TableCellElement,
  TableCellHeaderElement,
  TableElement,
  TableRowElement,
} from '@/components/ui/rich-text-editor/components/table-node'

export const TableKit = [
  TablePlugin.withComponent(TableElement),
  TableRowPlugin.withComponent(TableRowElement),
  TableCellPlugin.withComponent(TableCellElement),
  TableCellHeaderPlugin.withComponent(TableCellHeaderElement),
]
