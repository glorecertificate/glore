'use client'

import { useMarkToolbarButton, useMarkToolbarButtonState } from 'platejs/react'

import { ToolbarButton } from '@repo/ui/components/toolbar'

export const MarkToolbarButton = ({
  clear,
  nodeType,
  ...props
}: React.ComponentProps<typeof ToolbarButton> & {
  nodeType: string
  clear?: string[] | string
}) => {
  const state = useMarkToolbarButtonState({ clear, nodeType })
  const { props: buttonProps } = useMarkToolbarButton(state)
  return <ToolbarButton {...props} {...buttonProps} />
}
