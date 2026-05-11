'use client'

import { type TColumnElement } from 'platejs'
import { SlateElement, type SlateElementProps } from 'platejs/static'

export const ColumnElementStatic = (props: SlateElementProps<TColumnElement>) => {
  const divStyle = { width: props.element.width ?? '100%' }

  return (
    <div className="group/column relative" style={divStyle}>
      <SlateElement className="h-full px-2 pt-2 group-first/column:pl-0 group-last/column:pr-0" {...props}>
        <div className="relative h-full border border-transparent p-1.5">{props.children}</div>
      </SlateElement>
    </div>
  )
}

export const ColumnGroupElementStatic = (props: SlateElementProps) => (
  <SlateElement className="mb-2" {...props}>
    <div className="flex size-full rounded-sm">{props.children}</div>
  </SlateElement>
)
