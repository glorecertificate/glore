'use client'

import { getLinkAttributes } from '@platejs/link'
import { type TLinkElement } from 'platejs'
import { PlateElement, type PlateElementProps } from 'platejs/react'

const handleLinkMouseOver = (e: React.MouseEvent) => e.stopPropagation()

export const LinkElement = (props: PlateElementProps<TLinkElement>) => {
  const linkAttributes = {
    ...props.attributes,
    ...getLinkAttributes(props.editor, props.element),
    onMouseOver: handleLinkMouseOver,
  }

  return (
    <PlateElement
      {...props}
      as="a"
      attributes={linkAttributes}
      className="font-medium text-brand underline decoration-primary underline-offset-4"
    >
      {props.children}
    </PlateElement>
  )
}
