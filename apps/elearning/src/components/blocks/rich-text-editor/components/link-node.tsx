'use client'

import { getLinkAttributes } from '@platejs/link'
import { type TLinkElement } from 'platejs'
import { PlateElement, type PlateElementProps } from 'platejs/react'

export const LinkElement = (props: PlateElementProps<TLinkElement>) => (
  <PlateElement
    {...props}
    as="a"
    attributes={{
      ...props.attributes,
      ...getLinkAttributes(props.editor, props.element),
      onMouseOver: e => {
        e.stopPropagation()
      },
    }}
    className="font-medium text-brand underline decoration-primary underline-offset-4"
  >
    {props.children}
  </PlateElement>
)
