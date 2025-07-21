'use client'

import { PlateLeaf, type PlateLeafProps } from 'platejs/react'

export const HighlightLeaf = (props: PlateLeafProps) => (
  <PlateLeaf {...props} as="mark" className="bg-editor-highlight/30 text-inherit">
    {props.children}
  </PlateLeaf>
)
