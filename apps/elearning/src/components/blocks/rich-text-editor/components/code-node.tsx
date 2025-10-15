'use client'

import { PlateLeaf, type PlateLeafProps } from 'platejs/react'

export const CodeLeaf = (props: PlateLeafProps) => (
  <PlateLeaf
    {...props}
    as="code"
    className="whitespace-pre-wrap rounded-md bg-muted px-[0.3em] py-[0.2em] font-mono text-sm"
  >
    {props.children}
  </PlateLeaf>
)
