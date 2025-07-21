'use client'

import { PlateElement, type PlateElementProps } from 'platejs/react'

export const BlockquoteElement = (props: PlateElementProps) => (
  <PlateElement as="blockquote" className="my-1 border-l-2 pl-6 italic" {...props} />
)
