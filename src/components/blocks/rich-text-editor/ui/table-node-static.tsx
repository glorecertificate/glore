import { BaseTablePlugin } from '@platejs/table'
import { type TTableCellElement, type TTableElement } from 'platejs'
import { SlateElement, type SlateElementProps } from 'platejs/static'

import { cn } from '@/lib/utils'

export const TableElementStatic = ({ children, ...props }: SlateElementProps<TTableElement>) => {
  const { disableMarginLeft } = props.editor.getOptions(BaseTablePlugin)
  const marginLeft = disableMarginLeft ? 0 : props.element.marginLeft

  // eslint-disable-next-line
  const tableStyle = { paddingLeft: marginLeft }

  return (
    <SlateElement {...props} className="overflow-x-auto py-5" style={tableStyle}>
      <div className="group/table relative w-fit">
        <table className="mr-0 ml-px table h-px table-fixed border-collapse">
          <tbody className="min-w-full">{children}</tbody>
        </table>
      </div>
    </SlateElement>
  )
}

export const TableRowElementStatic = (props: SlateElementProps) => (
  <SlateElement {...props} as="tr" className="h-full">
    {props.children}
  </SlateElement>
)

export const TableCellElementStatic = ({
  isHeader,
  ...props
}: SlateElementProps<TTableCellElement> & {
  isHeader?: boolean
}) => {
  const { editor, element } = props
  const { api } = editor.getPlugin(BaseTablePlugin)

  const { minHeight, width } = api.table.getCellSize({ element })
  const borders = api.table.getCellBorders({ element })

  // eslint-disable-next-line
  const cellAttributes = {
    ...props.attributes,
    colSpan: api.table.getColSpan(element),
    rowSpan: api.table.getRowSpan(element),
  }
  // eslint-disable-next-line
  const cellStyle = {
    '--cellBackground': element.background,
    maxWidth: width || 240,
    minWidth: width || 120,
  } as React.CSSProperties
  // eslint-disable-next-line
  const innerDivStyle = { minHeight }

  return (
    <SlateElement
      {...props}
      as={isHeader ? 'th' : 'td'}
      attributes={cellAttributes}
      className={cn(
        'h-full overflow-visible border-none bg-background p-0',
        element.background ? 'bg-(--cellBackground)' : 'bg-background',
        isHeader && 'text-left font-normal *:m-0',
        'before:size-full',
        "before:absolute before:box-border before:content-[''] before:select-none",
        borders &&
          cn(
            borders.bottom?.size && 'before:border-b before:border-b-border',
            borders.right?.size && 'before:border-r before:border-r-border',
            borders.left?.size && 'before:border-l before:border-l-border',
            borders.top?.size && 'before:border-t before:border-t-border'
          )
      )}
      style={cellStyle}
    >
      <div className="relative z-20 box-border h-full px-4 py-2" style={innerDivStyle}>
        {props.children}
      </div>
    </SlateElement>
  )
}

export const TableCellHeaderElementStatic = (props: SlateElementProps<TTableCellElement>) => (
  <TableCellElementStatic {...props} isHeader />
)
